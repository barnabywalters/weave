# -*- coding: UTF-8

import json

VERSION = '1.2.4'
BUILD = '744e69cf4136'


class ExtensionInfo(object):
	# Common
	id = ''
	name = ''
	description = ''
	version = ''
	creator = ''
	homepage_url = ''
	content_scripts = []
	background_scripts = []
	settings = None
	browser_button = None
	toolbar = None
	update_url = ''
	update_path_url = ''
	debug = False
	modules = []
	locales = []
	default_locale = ''
	options_page = None
	context_menu_item = None

	# Safari
	developer_id = ''

	# IE deprecated
	bho_iid = ''
	toolbar_iid = ''
	bho_clsid = ''
	toolbar_clsid = ''
	libid = ''

	# IE
	updater = {}
	com_objects = {}

	# Opera
	mail = ''

	# Firefox
	package_id = None

	# Chrome
	chrome_public_key = ''


	# Internal
	kango_version = None
	def merge(self, seq):
		result = []
		for s in seq:
			if s not in result:
				result.append(s)
		return result

	def load(self, filename):
		with open(filename, 'r') as f:
			info = json.load(f, encoding='utf-8')
			for elem in info:
				if hasattr(self, elem):
					if elem == 'background_scripts':
						self.background_scripts = self.merge(self.background_scripts + info[elem])
					elif elem == 'content_scripts':
						self.content_scripts = self.merge(self.content_scripts + info[elem])
					else:
						self.__dict__[elem] = info[elem]

	def save(self, filename):
		with open(filename, 'w') as f:
			json.dump(self.__dict__, f, skipkeys=True, indent=2)
