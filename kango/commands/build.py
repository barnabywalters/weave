# -*- coding: UTF-8

import kango
import imp
import sys
import logging
from kango.commands import Command
from kango.utils import *
from kango.merger import *

logger = logging.getLogger('kango')


class ProjectBuilder(object):
	_extension_info_name = 'extension_info.json'
	_output_dir_name = 'output'
	_builders = []
	_ignore_names = ('.svn', '.hg', '.git', '.idea', '*.exp', '*.ilk', '*.lib')

	def __init__(self):
		import kango.builders.chrome
		import kango.builders.firefox
		import kango.builders.opera
		import kango.builders.safari
		self._builders = [kango.builders.chrome.ExtensionBuilder,
					kango.builders.firefox.ExtensionBuilder,
					kango.builders.opera.ExtensionBuilder,
					kango.builders.safari.ExtensionBuilder
		]
		try:
			import kango.builders.internet_explorer
			self._builders.append(kango.builders.internet_explorer.ExtensionBuilder)
		except ImportError:
			logger.info('Contact extensions@kangoextensions.com to enable IE support')

	def _copy_extension_files(self, src, dst, extension_key):

		if not os.path.exists(dst):
			os.makedirs(dst)

		# copy common files
		copy_dir_contents(os.path.join(src, 'common'), dst, ignore=shutil.ignore_patterns(*self._ignore_names))

		# copy browser specific files
		names = os.listdir(src)
		names.sort(lambda x, y: cmp(y.count(' '), x.count(' ')))
		merger = DirectoryMerger()
		for name in names:
			if extension_key in name:
				merger.merge(os.path.join(src, name), dst, shutil.ignore_patterns(*self._ignore_names))

	def _get_locales(self, extension_out_path):
		locales_path = os.path.join(extension_out_path, 'locales')
		if os.path.isdir(locales_path):
			files = os.listdir(locales_path)
			for filename in files:
				name, ext = os.path.splitext(filename)
				if os.path.isfile(os.path.join(locales_path, filename)) and ext == '.json':
					yield name

	def _build_extension(self, builder_class, project_dir, out_path, args, build_steps):
		key = builder_class.key
		info = kango.ExtensionInfo()
		kango_path = sys.path[0]
		builder = builder_class(info, kango_path)

		project_src_path = os.path.join(project_dir, 'src')
		framework_src_path = os.path.join(kango_path, 'src', 'js')

		builder.migrate((os.path.join(project_src_path, key)))

		# merge extension_info
		info.load(os.path.join(project_src_path, 'common', self._extension_info_name))
		info.load(os.path.join(project_src_path, key, self._extension_info_name))

		logger.info('Building %s extension...' % key)

		extension_out_path = os.path.join(out_path, key)

		# merge framework and project sources
		self._copy_extension_files(framework_src_path, extension_out_path, key)
		self._copy_extension_files(project_src_path, extension_out_path, key)

		# copy files from additional source path
		additional_source_path = args.additional_source_path
		if additional_source_path is not None:
			paths = additional_source_path.split(';')
			for path in paths:
				self._copy_extension_files(path, extension_out_path, key)

		# add locales
		locales = list(self._get_locales(extension_out_path))
		if len(locales) > 0:
			info.locales = locales
			if info.default_locale == '':
				logger.error('"locales" directory exists, but "default_locale" is not set')
				sys.exit(1)

		builder.setup_update(out_path)

		extension_out_path = builder.build(extension_out_path)
		if extension_out_path:
			info.kango_version = '%s %s' % (kango.VERSION, kango.BUILD)

			info.save(os.path.join(extension_out_path, self._extension_info_name))

			# execute build steps
			for step in build_steps:
				step.pre_pack(extension_out_path, project_dir, info, args)

			if not args.no_pack:
				builder.pack(out_path, extension_out_path, os.path.join(project_src_path, key))
		else:
			logger.error("Can't build %s extension" % key)

	def build(self, project_dir, args, build_steps):
		if project_dir == sys.path[0]:
			logger.error('You must set project directory')
			sys.exit(1)

		if args.output_directory is None:
			out_path = os.path.join(project_dir, self._output_dir_name)
		else:
			out_path = args.output_directory

		project_src_path = os.path.join(project_dir, 'src')

		shutil.rmtree(out_path, True)

		for builderClass in self._builders:
			if os.path.isdir(os.path.join(project_src_path, builderClass.key)):
				self._build_extension(builderClass, project_dir, out_path, args, build_steps)
				
		try:
			import urllib
			import urllib2
			import random
			info = kango.ExtensionInfo()
			info.load(os.path.join(project_src_path, 'common', self._extension_info_name))
			params = '/'.join(('kango', '%s-%s' % (kango.VERSION, kango.BUILD), info.name, info.update_path_url))
			params = urllib.quote(params)
			url = 'http://www.google-analytics.com/__utm.gif?utmwv=4u.4sh&utmn=%f&utmr=&utmp=%s&utmac=UA-40349874-1&utmcc=__utma%%3D1.%s' % (random.random(), params, '.'.join(['%d' % (random.random()*1000000000) for i in range(0,6)]))
			urllib2.urlopen(url, timeout=3)
		except:
			pass


class BuildCommand(Command):

	_build_steps = []

	def __init__(self):
		# load default build steps
		self._load_build_steps(os.path.join(sys.path[0], 'kango', 'buildsteps'))

	def _load_class(self, path, expected_name):
		mod_name, file_ext = os.path.splitext(os.path.split(path)[-1])
		module = None

		if mod_name != '__init__' and file_ext.lower() == '.py':
			module = imp.load_source(mod_name, path)
		# TODO: load .pyc
		#elif file_ext.lower() == '.pyc':
		#	module = imp.load_compiled(mod_name, path)

		if module is not None and hasattr(module, expected_name):
			return getattr(module, expected_name)

		return None

	def _load_build_steps(self, steps_path):
		if os.path.isdir(steps_path):
			files = os.listdir(steps_path)
			for filename in files:
				path = os.path.join(steps_path, filename)
				if os.path.isfile(path):
					step_class = self._load_class(path, 'BuildStep')
					if step_class is not None:
						self._build_steps.append(step_class())

	def init_subparser(self, subparsers):
		parser_build = subparsers.add_parser('build', help='Build project.')
		parser_build.add_argument('project_directory')
		parser_build.add_argument('--output-directory')
		parser_build.add_argument('--additional-source-path')
		parser_build.add_argument('--no-pack', action='store_true')

		for step in self._build_steps:
			try:
				step.init_subparser(parser_build)
			except AttributeError:
				pass

		return parser_build

	def execute(self, args):
		project_dir = args.project_directory
		if os.path.isdir(project_dir):
			# load build steps from project directory
			self._load_build_steps(os.path.join(project_dir, 'buildsteps'))
			builder = ProjectBuilder()
			builder.build(project_dir, args, self._build_steps)
		else:
			logger.error("Can't find directory %s" % project_dir)
