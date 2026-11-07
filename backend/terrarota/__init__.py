# 1. Register PyMySQL as MySQLdb if available
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# 2. ALWAYS bypass MariaDB 10.4.x version check & disable RETURNING for XAMPP compatibility
try:
    from django.db.backends.base.base import BaseDatabaseWrapper
    from django.db.backends.mysql.features import DatabaseFeatures

    BaseDatabaseWrapper.check_database_version_supported = lambda self: None
    DatabaseFeatures.can_return_columns_from_insert = False
except Exception:
    pass
