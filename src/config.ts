/**
 * @license
 * Copyright 2022 Qlever LLC
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

/* eslint-disable unicorn/no-null */

import "dotenv/config";
import convict from "convict";

export const config = convict({
  oada: {
    domain: {
      doc: "OADA API domain",
      format: String,
      default: "localhost",
      env: "DOMAIN",
      arg: "domain",
    },
    token: {
      doc: "OADA API token",
      format: String,
      default: "god",
      sensitive: true,
      env: "TOKEN",
      arg: "token",
    },
    concurrency: {
      doc: "OADA API concurrency",
      format: "int",
      default: 10,
      env: "CONCURRENCY",
      arg: "concurrency",
    },
  },
  sendgrid: {
    key: {
      doc: "Sendgrid API key",
      format: String,
      default: null as unknown as string,
      sensitive: true,
      env: "API_KEY",
      arg: "api-key",
    },
  },
});

/**
 * Error if our options are invalid.
 * Warn if extra options found.
 */
config.validate({ allowed: "warn" });
