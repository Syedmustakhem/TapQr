## Why separate User and AuthProvider?

User stores business identity.

AuthProvider stores login methods.

A single user can authenticate using:

- Email
- Phone OTP
- Google

This avoids duplicate accounts and makes the authentication system extensible.