# -*- coding: UTF-8

import argparse
import kango
import logging
import sys
from kango.commands.create import CreateProjectCommand
from kango.commands.build import BuildCommand

__title__ = 'Kango'

logger = logging.getLogger('kango')


class RejectFilter(logging.Filter):

	def __init__(self, reject):
		logging.Filter.__init__(self)
		self.reject = reject

	def filter(self, record):
		return self.reject(record)


def setup_logger():
	logger = logging.getLogger('kango')
	logger.setLevel(logging.INFO)
	formatter = logging.Formatter('[%(levelname)7s] %(message)s')

	stdout_handler = logging.StreamHandler(sys.stdout)
	stdout_handler.setFormatter(formatter)
	stdout_handler.addFilter(RejectFilter(lambda record: record.levelno != logging.INFO))
	logger.addHandler(stdout_handler)

	stderr_handler = logging.StreamHandler(sys.stderr)
	stderr_handler.setFormatter(formatter)
	stderr_handler.addFilter(RejectFilter(lambda record: record.levelno == logging.INFO))
	logger.addHandler(stderr_handler)


class CommandLineProcessor(object):
	_commands = [CreateProjectCommand, BuildCommand]

	def process(self):

		setup_logger()

		parser = argparse.ArgumentParser(description='%s %s' % (__title__, kango.VERSION))
		subparsers = parser.add_subparsers()

		for command_class in self._commands:
			command = command_class()
			subparser = command.init_subparser(subparsers)
			subparser.set_defaults(execute=command.execute)

		args = parser.parse_args()

		logger.info('%s %s started' % (__title__, kango.VERSION))

		args.execute(args)
