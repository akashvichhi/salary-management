from datetime import timedelta

# Five failed logins per email and IP within 15 minutes; the sixth attempt gets a 429.
LOGIN_MAX_FAILURES = 5
LOGIN_FAILURE_WINDOW = timedelta(minutes=15)
# request.client is empty only for unusual transports; they share one counter per email.
UNKNOWN_CLIENT_IP = "unknown"
