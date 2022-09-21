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

import { config } from './config.js';

import { strict as assert } from 'node:assert';

import type { AttachmentData } from '@sendgrid/helpers/classes/attachment.js';
import Cache from 'timed-cache';
import Handlebars from 'handlebars';
import debug from 'debug';
import mail from '@sendgrid/mail';

import {
  type Email,
  type default as EmailConfig,
  assert as assertEmailConfig,
} from '@oada/types/trellis/service/abalonemail/config/email.js';
import { Service } from '@oada/jobs';
import { connect } from '@oada/client';

const oada = config.get('oada');
const apiKey = config.get('sendgrid.key');

const log = {
  info: debug('abalonemail:info'),
  debug: debug('abalonemail:debug'),
  error: debug('abalonemail:error'),
  trace: debug('abalonemail:trace'),
};

mail.setApiKey(apiKey);

const name = 'abalonemail';
const conn = await connect(oada);
const service = new Service({
  name,
  oada: conn,
});

/**
 * How often to allow emailing the same email (in ms)
 * @todo get this from the service config
 */
const rateLimit = 24 * 60 * 60 * 1000;

// ???: This cache is probably overkill
const sent = new Cache<Email | Email[], true>({ defaultTtl: rateLimit });

const actionName = 'email';
service.on(actionName, 10 * 1000, async (job, { jobId, log: jobLog }) => {
  log.debug('μservice triggered');

  void jobLog.info('started', 'Job started');

  const { config: jobConfig } = job;
  assertEmailConfig(jobConfig);

  void jobLog.trace('confirmed', 'Job config confirmed');

  const response = await email(jobConfig);

  log.info('Sent email for job %s', jobId);

  return response;
});

async function email(
  {
    multiple,
    from,
    to,
    replyTo,
    subject,
    text,
    html,
    attachments: attach = [],
    templateData,
  }: EmailConfig,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  jobLog = { info: log.info, debug: log.trace }
) {
  // Check rate-limit?
  if (sent.get(to)) {
    jobLog.info('cancelled', 'Email cancelled due to rate limit');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    throw new Error(`Rate limit of ${rateLimit} ms on ${to}`);
  }

  const attachments: AttachmentData[] = [];
  for (const { content, ...rest } of attach) {
    // FIXME: Support base64 encoding binary attachments
    assert(typeof content === 'string', 'Binary attachments not supported');
    attachments.push({ content, ...rest });
  }

  // Fill out template
  if (templateData) {
    log.info('Fetching template');
    text = text && Handlebars.compile(text)(templateData);
    html = html && Handlebars.compile(html)(templateData);
  }

  jobLog.debug('sending', 'Sending email');
  const r = await mail.send(
    {
      from,
      to,
      replyTo,
      subject,
      text: text!,
      html,
      attachments,
    },
    multiple ?? true
  );
  sent.put(to, true);

  return { statusCode: r[0].statusCode };
}

await service.start();

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
  log.error(error, 'unhandledRejection');
});
