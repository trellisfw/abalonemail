/**
 * @license
 * Copyright 2020 Qlever LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { strict as assert } from 'assert';
import { connect } from '@oada/client';
import { config } from 'dotenv';
import debug from 'debug';
import mail from '@sendgrid/mail';
import type { AttachmentData } from '@sendgrid/helpers/classes/attachment'
import Handlebars from 'handlebars';
import Cache from 'timed-cache'
// import axios from 'axios';

import { Service } from '@oada/jobs';
import EmailConfig, { assert as assertEmailConfig } from '@oada/types/trellis/service/abalonemail/config/email.js';

//import { RulesWorker } from '@trellisfw/rules-worker'

config();
const domain = process.env.DOMAIN ?? process.env.domain;
assert(domain, 'Set ENV `domain` to domain storing the service configuration');
const token = process.env.TOKEN ?? process.env.token;
assert(token, 'Set ENV `token` to the service token');
const apiKey = process.env.API_KEY ?? process.env.apiKey;
assert(apiKey, 'set ENV `apiKey` to the service sendgrid API key');

// const trace = debug('abalonemail:trace');
const info = debug('abalonemail:info');
const trace = debug('abalonemail:trace');
// const error = debug('abalonemail:error');

mail.setApiKey(apiKey);

const name = 'abalonemail';
const oada = await connect({
  domain: `https://${domain}`,
  token,
  concurrency: 10
})
const service = new Service({oada, name});//, domain, token, 10);

/**
 * How often to allow emailing the same email (in ms)
 * @todo get this from the service config
 */
const rateLimit = 0;
//const rateLimit = 24 * 60 * 60 * 1000

// TODO: This cache is probably overkill
const sent = new Cache({defaultTtl: rateLimit})

const actionName = 'email'
service.on(
  actionName,
  10 * 1000,
  async (job, { jobId, log }) => {
    info('μservice triggered');

    log.info('started', 'Job started');

    const { config } = job;
    assertEmailConfig(config);

    log.trace('confirmed', 'Job config confirmed');

    const res = await email(config)

    info(`Sent email for job ${jobId}`)

    return res
});

async function email(config: EmailConfig, log = { info, debug: trace }) {
  // Check rate-limit?
  if (sent.get(config.to)) {
    log.info('cancelled', 'Email cancelled due to rate limit')
    throw new Error(`Rate limit of ${rateLimit} ms on ${config.to}`)
  }

  let { text, html } = config;

  const attachments: AttachmentData[] = [];
  for (const { content, ...rest } of config.attachments || []) {
    // TODO: Support base64 encoding binary attachments
    assert(typeof content === 'string', 'Binary attachments not supported');
    attachments.push({ content, ...rest });
  }

  // Fill out template
  if (config.templateData) {
    info('Fetching template');
    const { templateData: data } = config;

    text = text && Handlebars.compile(text)(data);
    html = html && Handlebars.compile(html)(data);
  }

  log.debug('sending', 'Sending email');
  const r = await mail.send(
    {
      from: config.from,
      to: config.to,
      replyTo: config.replyTo,
      subject: config.subject,
      text: text as string,
      html,
      attachments,
    },
    config.multiple ?? true
  );
  sent.put(config.to, true)
  console.log('RRRRRRRRRRRRRRRRR', r)

  return { statusCode: r[0].statusCode };
}

service.start().catch((e: unknown) => {
  console.log('ERROR');
  console.error(e);
});

// Create worker for rules engine
// Just sends a test email for now
/*
new RulesWorker({
  name,
  // TODO: This seems off?
  conn: service.getClient(domain).clone(token),
  actions: [{
    name: actionName,
    service: name,
    type: 'application/json',
    description: 'send as attachment in an email to test@qlever.io',
    async callback(item: unknown) {
      const content = Buffer.from(JSON.stringify(item)).toString('base64')
      await email({
        from: `noreply@${domain}`,
        to: 'test@qlever.io',
        subject: 'Test email',
        text: 'Please see attached.',
        attachments: [{
          filename: 'test.json',
          type: 'application/json',
          content
        }]
      })
    }
  }]
})
*/

process.on('unhandledRejection', (error) => {
  console.error('unhandledRejection', error);
});