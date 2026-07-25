#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    if 'runserver' in sys.argv:
        import django
        django.setup()
        from django.conf import settings
        db = settings.DATABASES['default']
        engine = db['ENGINE'].rsplit('.', 1)[-1]
        name = db['NAME']
        host = db.get('HOST', '')
        port = db.get('PORT', '')
        print(f"\n[DB] Using {engine} database: {name} @ {host}:{port}\n")

    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
