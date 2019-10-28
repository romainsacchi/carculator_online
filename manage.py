from flask.ext.rq import get_worker
from flask.ext.script import Manager

from myapp import app


manager = Manager(app)


@manager.command
def work():
    """Process the queue."""
    get_worker().work()


if __name__ == '__main__':
    manager.run()