# abalonemail

A microservice to send emails in response to job queue items using sendgrid.
Example job queue item:

```json
{
  "service": "abalonemail",
  "type": "email",
  "config": {
    "multiple": false,
    "from": "john@example.com",
    "to": {
      "name": "Andrew Balmos",
      "email": "abalmos@gmail.com"
    },
    "subject": "Test mail",
    "text": "Test!",
    "html": "<h1>Test!</h1>"
  }
}
```

Checkout @oada/formats for a more detailed description of the format.

The from address and the sendgrid API key are set with `.env`. For example:

```env
domain=oada.example.org
token=ajxhcjkal7y83hdsjkhc8l2
apiKey=aksdjca83d.asdfkxjjc93cSDFUsDaAfaj23FEVhSDvksljsadv0CdADs3V0g84rjksdf
```

## Installation

```bash
cd /path/to/your/oada-srvc-docker
cd services-available
git clone git@github.com:trellisfw/abalonemail.git
cd ../services-enabled
ln -s ../services-available/abalonemail .
```

## Overriding defaults for production

Using `z_tokens` method from `oada-srvc-docker`, the following docker-compose entry overrides configs for production:

```docker-compose
  abalonemail:
    environment:
      - token=aproductiontokentouse
      - domain=your.trellis.domain
      - emailKey=thekeyforsendgridsapi
      - from=demo@some.domain
```
