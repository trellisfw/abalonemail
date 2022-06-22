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
      "name": "Billy bob",
      "email": "bb@exampe.org"
    },
    "subject": "Test mail",
    "templateData": {
      "foo": "bar"
    },
    "text": "Test!",
    "html": "<h1>Test: {{ foo }}</h1>",
    "attachments": [
      {
        "content": "RXhhbXBsZSBkYXRh",
        "filename": "test.dat",
        "type": "plain/text"
      }
    ]
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
      - TOKEN=aproductiontokentouse
      - DOMAIN=your.trellis.domain
      - API_KEY=thekeyforsendgridsapi
```
