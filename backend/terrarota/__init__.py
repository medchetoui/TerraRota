try:
    import pymysql
    pymysql.install_as_MySQLdb()

    # Bypass MariaDB version check and disable RETURNING clause for MariaDB 10.4.x (XAMPP)
    from django.db.backends.base.base import BaseDatabaseWrapper
    from django.db.backends.mysql.features import DatabaseFeatures

    BaseDatabaseWrapper.check_database_version_supported = lambda self: None
    DatabaseFeatures.can_return_columns_from_insert = False
except ImportError:
    pass
