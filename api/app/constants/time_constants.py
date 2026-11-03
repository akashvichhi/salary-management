from datetime import timedelta, timezone

IST_UTC_OFFSET = timedelta(hours=5, minutes=30)

# Asia/Kolkata has had no daylight saving since 1945, so this fixed offset always
# equals the IANA zone, without the tzdata package that Windows and slim images lack.
APP_TIMEZONE = timezone(IST_UTC_OFFSET, "IST")
