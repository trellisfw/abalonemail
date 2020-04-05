# abalonemail

A microservice to send emails in response to job queue items using sendgrid.


Example task object:

```json
{
    "to": "test@qlever.io",
    "replyTo": "",
    "cc": "",
    "bcc": "",
    "subject": "Test",

    // Can supply text, html, or both
    "text": "This is an email to {{ name }}}",
    "html": "<p>This is an email to {{ name }}}<p>",
    "templatePath": "/parsed", // Optional path to data to use as context for handlebars templates

    "headers": {
        "X-FOOBAR": "BAZ"
    }

    "attachments": [
        // Can either give just a path or an object of optional properties
        "/pdf",
        {
            "path": "/foo/png", // required
            "filename": "cat.png", // defaults to attachment_i where i is array index
            "disposition": "attachment", // attachment or inline (defaults to attachment)
            "content_id": "cat", // id for use with inline attachments
            "type": "application/png" // defaults to what OADA says is the content type
        }
    ]
}
```

The from address and the sendgrid API key are set with `.env` or via `nconf`.

## Installation:
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
