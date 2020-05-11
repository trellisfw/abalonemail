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
// import Handlebars from 'handlebars';
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
  async (job, { jobId, log /* oada */ }): Promise<Json> => {
    info('μservice triggered');

    log.info('started', 'Job started');

    const config = job.config;
    assertEmailConfig(config);

    log.trace('confirmed', 'Job config confirmed');

    let text = config.text || '';
    let html = config.html;

    /*
     * Note: You have @oada/client at `context.oada`. It is already connected,
     * concurrency controlled, and correctly tokened to your user.
     */
    /*
    if (config.templatePath) {
      info('Fetching template');
      const { data } = await oada.get({ path: config.templatePath });
      trace(data);

      text = Handlebars.compile(data)(config.templateParams);
      htlm = Handlebars.compile(data)(config.templateParams);
    }
    */

    info(`Sending email for task ${jobId}`);
    log.debug('sending', 'Sending email');
    const r = await send(
      {
        from: config.from,
        to: config.to,
        replyTo: config.replyTo,
        subject: config.subject,
        text: text,
        html: html,
        // attachments: config.attachments,
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
