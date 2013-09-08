# -*- coding: UTF-8

import struct
import os
import shutil
import sys
import json
import codecs
import subprocess
import xml
import logging
from array import *
from kango.utils import *
from kango.builders import ExtensionBuilderBase

logger = logging.getLogger('kango')


class ExtensionBuilder(ExtensionBuilderBase):
	key = 'chrome'
	package_extension = '.crx'

	_manifest_filename = 'manifest.json'
	_background_host_filename = 'background.html'
	_info = None
	_kango_path = None

	def __init__(self, info, kango_path):
		self._info = info
		self._kango_path = kango_path

	def _unix_find_app(self, prog_filename):
		bdirs = ('$HOME/Environment/local/bin/',
				 '$HOME/bin/',
				 '/share/apps/bin/',
				 '/usr/local/bin/',
				 '/usr/bin/')
		for dir in bdirs:
			path = os.path.expandvars(os.path.join(dir, prog_filename))
			if os.path.exists(path):
				return path
		return None

	def get_chrome_path(self):
		if sys.platform.startswith('win'):
			root_pathes = ('${LOCALAPPDATA}',
							'${APPDATA}',
							'${ProgramFiles(x86)}',
							'${ProgramFiles}'
			)

			app_pathes = (os.path.join('Google', 'Chrome', 'Application', 'chrome.exe'),
							os.path.join('Chromium', 'Application', 'chrome.exe'))

			for root_path in root_pathes:
				for app_path in app_pathes:
					path = os.path.expandvars(os.path.join(root_path, app_path))
					if os.path.exists(path):
						return path

		elif sys.platform.startswith('linux'):
			appnames = ('chromium-browser', 'google-chrome', 'chromium')
			for apppath in appnames:
				path = self._unix_find_app(apppath)
				if path is not None:
					return path

		elif sys.platform.startswith('darwin'):
			if os.path.exists('/Applications/Google Chrome.app'):
				return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
			elif os.path.exists('/Applications/Chromium.app'):
				return '/Applications/Chromium.app/Contents/MacOS/Chromium'
		return None

	def _load_manifest(self, manifest_path):
		with open(manifest_path, 'r') as f:
			manifest = json.load(f)
			return manifest

	def _save_manifest(self, manifest, manifest_path):
		with open(manifest_path, 'w') as f:
			json.dump(manifest, f, skipkeys=True, indent=2)

	def _patch_manifest(self, manifest):
		if self._info.update_url == '':
			del manifest['update_url']

		if self._info.homepage_url == '':
			del manifest['homepage_url']

		if self._info.chrome_public_key != '':
			manifest['key'] = self._info.chrome_public_key

		for elem in manifest:
			if elem != 'content_scripts' and hasattr(self._info, elem):
				manifest[elem] = getattr(self._info, elem)

		if self._info.browser_button is None:
			del manifest['browser_action']
		else:
			manifest['browser_action']['default_icon'] = self._info.browser_button['icon']
			manifest['browser_action']['default_title'] = self._info.browser_button['tooltipText']
			if 'popup' not in self._info.browser_button:
				del manifest['browser_action']['default_popup']

		if not self._info.content_scripts:
			del manifest['content_scripts']

		if self._info.options_page is None:
			del manifest['options_page']

	def _merge_includes(self, manifest, out_path):
		if 'content_scripts' in manifest:
			self.merge_files(os.path.join(out_path, 'includes', 'content.js'),
								map(lambda path: os.path.join(out_path, path), manifest['content_scripts'][0]['js']))

			os.remove(os.path.join(out_path, 'includes/content_kango.js'))
			os.remove(os.path.join(out_path, 'includes/content_init.js'))

			manifest['content_scripts'][0]['js'] = ['includes/content.js']

	def _zip2crx(self, zipPath, keyPath, crxPath):
		"""
		:param zipPath: path to .zip file
		:param keyPath: path to .pem file
		:param crxPath: path to .crx file to be created
		"""
		# Sign the zip file with the private key in PEM format
		signature = subprocess.Popen(['openssl', 'sha1', '-sign', keyPath, zipPath], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

		# Convert the PEM key to DER (and extract the public form) for inclusion in the CRX header
		derkey = subprocess.Popen(['openssl', 'rsa', '-pubout', '-inform', 'PEM', '-outform', 'DER', '-in', keyPath], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

		out = open(crxPath, 'wb')
		out.write('Cr24')  # Extension file magic number
		
		header = array('L') if struct.calcsize('L') == 4 else array('I')

		header.append(2)  # Version 2
		header.append(len(derkey))
		header.append(len(signature))
		header.tofile(out)
		out.write(derkey)
		out.write(signature)
		out.write(open(zipPath, 'rb').read())

	def _generate_private_key(self, keyPath):
		subprocess.Popen(['openssl', 'genrsa', '-out', './out.pem', '1024'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		subprocess.Popen(['openssl', 'pkey', '-in', './out.pem', '-out', keyPath], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		os.remove('./out.pem')

	def _pack_via_open_ssl(self, zipPath, keyPath, crxPath):
		if not os.path.isfile(keyPath):
			self._generate_private_key(keyPath)
		self._zip2crx(zipPath, keyPath, crxPath)

	def _pack_zip(self, dst, src):
		"""
		:param dst:	path folder where extension package will be created (./output)
		:param src:	path to extension files folder (./output/chrome)
		"""
		zipName = self.get_package_name(self._info) + '_chrome_webstore.zip'
		zip = ZipDirectoryArchiver()
		outpath = os.path.abspath(os.path.join(dst, zipName))
		zip.archive(src, outpath)
		return outpath

	def _build_locales(self, manifest, out_path):
		if len(self._info.locales) > 0:
			special_keys = ('name', 'description')
			locale_keys = ['__info_%s__' % key for key in special_keys]
			chrome_keys = ['info_%s' % key for key in special_keys]
			locales = self.get_locales(self._info.locales, out_path)
			for name, locale in locales:
				if any(key in locale_keys for key in locale):
					chrome_locale = {}
					for key, locale_key, chrome_key in zip(special_keys, locale_keys, chrome_keys):
						if locale_key in locale:
							chrome_locale[chrome_key] = {'message': locale[locale_key]}
							manifest[key] = '__MSG_%s__' % chrome_key
					locale_dir = os.path.join(out_path, '_locales', name)
					os.makedirs(locale_dir)
					with open(os.path.join(locale_dir, 'messages.json'), 'w') as f:
						json.dump(chrome_locale, f, skipkeys=True, indent=2)
					manifest['default_locale'] = self._info.default_locale

	def build(self, out_path):
		manifest_path = os.path.join(out_path, self._manifest_filename)
		manifest = self._load_manifest(manifest_path)
		self._patch_manifest(manifest)
		self._build_locales(manifest, out_path)
		self._merge_includes(manifest, out_path)
		self._save_manifest(manifest, manifest_path)
		self.patch_background_host(os.path.join(out_path, self._background_host_filename), self._info.modules)
		return out_path

	def pack(self, dst, src, src_path):
		"""
		:param dst:	path folder where extension package will be created (./output)
		:param src:	path to extension files folder (./output/chrome)
		:param src_path: path to project source folder (./src/chrome)
		"""
		extension_path = os.path.abspath(src)
		certificate_path = os.path.abspath(os.path.join(src_path, '../', '../', 'certificates'))
		if not os.path.exists(certificate_path):
			os.makedirs(certificate_path)
		certificate_path = os.path.join(certificate_path, 'chrome.pem')
		extension_dst = os.path.abspath(os.path.join(extension_path, '../', 'chrome.crx'))

		zipPath = self._pack_zip(dst, src)
		crxPath = os.path.join(dst, self.get_full_package_name(self._info))

		chrome_path = self.get_chrome_path()
		if chrome_path is not None:
			args = [chrome_path, '--pack-extension=%s' % extension_path, '--no-message-box']
			if os.path.isfile(certificate_path):
				args.append('--pack-extension-key=%s' % certificate_path)

			subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()

			try:
				shutil.move(os.path.abspath(os.path.join(extension_path, '../', 'chrome.pem')), certificate_path)
			except:
				pass

			shutil.move(extension_dst, crxPath)
		else:
			logger.info('Chrome/Chromium is not installed, trying OpenSSL...')
			try:
				self._pack_via_open_ssl(zipPath, certificate_path, crxPath)
			except:
				logger.error("Can't build extension with OpenSSL")

	def setup_update(self, out_path):
		if self._info.update_url != '' or self._info.update_path_url != '':
			update_xml_filename = 'update_chrome.xml'
			xml_path = os.path.join(self._kango_path, 'src', 'xml', update_xml_filename)

			doc = xml.dom.minidom.parse(xml_path)
			app = doc.getElementsByTagName('app')[0]
			app.setAttribute('appid', self._info.id)
			updatecheck = app.getElementsByTagName('updatecheck')[0]
			updatecheck.setAttribute('codebase', self._info.update_path_url + self.get_full_package_name(self._info))
			updatecheck.setAttribute('version', self._info.version)

			with codecs.open(os.path.join(out_path, update_xml_filename), 'w', 'utf-8') as f:
				doc.writexml(f, encoding='utf-8')

			self._info.update_url = self._info.update_url if self._info.update_url != '' else self._info.update_path_url + update_xml_filename

	def migrate(self, src_path):
		pass