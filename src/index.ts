/* Copyright 2020 Qlever LLC
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
import { config } from 'dotenv';
import debug from 'debug';
import { setApiKey, send } from '@sendgrid/mail';
import Handlebars from 'handlebars';
// import axios from 'axios';

import { Service, Json } from '@oada/jobs';
import { assert as assertEmailConfig } from '@oada/types/trellis/service/abalonemail/config/email';

config();
const domain = process.env.domain;
assert(domain, 'Set ENV `domain` to domain storing the service configuration');
const token = process.env.token;
assert(token, 'Set ENV `token` to the service token');
const apiKey = process.env.apiKey;
assert(apiKey, 'set ENV `apiKey` to the service sendgrid API key');

// const trace = debug('abalonemail:trace');
const info = debug('abalonemail:info');
// const error = debug('abalonemail:error');

setApiKey(apiKey);

const service = new Service('abalonemail', domain, token, 10);

service.on(
  'email',
  10 * 1000,
  async (job, { jobId, log }): Promise<Json> => {
    info('μservice triggered');

    log.info('started', 'Job started');

    const { config } = job;
    assertEmailConfig(config);

    log.trace('confirmed', 'Job config confirmed');

    let { text, html } = config;

    type Attachment = typeof config.attachments[0] & { content: string };
    const attachments: Attachment[] = [];
    for (const { content, ...rest } of config.attachments) {
      // TODO: Support base64 encoding binary attachments
      assert(typeof content === 'string', 'Binary attachments not supported');
      attachments.push({ content, ...rest });
    }

    // Fill out template
    if (config.templateData) {
      info('Fetching template');
      const { templateData: data } = config;

      text = text ?? Handlebars.compile(text)(data);
      html = html ?? Handlebars.compile(html)(data);
    }

    info(`Sending email for task ${jobId}`);
    log.debug('sending', 'Sending email');
    const r = await send(
      {
        from: config.from,
        to: config.to,
        replyTo: config.replyTo,
        subject: config.subject,
        text,
        html,
        attachments,
      },
      config.multiple ?? true
    );

    return { statusCode: r[0].statusCode };
  }
);

service.start().catch((e: unknown) => {
  console.log('ERROR');
  console.error(e);
});

process.on('unhandledRejection', (error) => {
  console.error('unhandledRejection', error);
});
