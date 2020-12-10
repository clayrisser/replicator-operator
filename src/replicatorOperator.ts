/**
 * Copyright 2020 Silicon Hills LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as k8s from '@kubernetes/client-node';
import YAML from 'yaml';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import Operator, {
  ResourceEventType,
  ResourceMetaImpl
} from '@dot-i/k8s-operator';
import Logger from './logger';
import { Config } from './config';
import { Replicator } from './services';
import ResourceTracker from './resourceTracker';
import {
  ReplicatorResource,
  ReplicatorStatus,
  ReplicatorStatusPhase,
  OperatorFrameworkProject,
  ResourceGroup,
  ResourceKind,
  ResourceVersion
} from './types';

export const project: OperatorFrameworkProject = YAML.parse(
  fs.readFileSync(path.resolve(__dirname, '../PROJECT')).toString()
);

export default class ReplicatorOperator extends Operator {
  static labelNamespace = 'dev.siliconhills.helm2cattle';

  spinner = ora();

  customObjectsApi: k8s.CustomObjectsApi;

  resourceTracker = new ResourceTracker<ReplicatorResource>();

  constructor(protected config: Config, protected log = new Logger()) {
    super(log);
    this.customObjectsApi = this.kubeConfig.makeApiClient(k8s.CustomObjectsApi);
  }

  protected async addedReplicator(
    resource: ReplicatorResource,
    _meta: ResourceMetaImpl,
    _oldResource?: ReplicatorResource
  ) {
    try {
      await this.updateStatus(
        {
          message: 'creating replicator',
          phase: ReplicatorStatusPhase.Pending,
          ready: false
        },
        resource
      );
      const replicator = new Replicator(resource);
      await replicator.apply();
      await this.updateStatus(
        {
          message: 'created replicator',
          phase: ReplicatorStatusPhase.Succeeded,
          ready: true
        },
        resource
      );
    } catch (err) {
      await this.updateStatus(
        {
          message: err.message?.toString() || '',
          phase: ReplicatorStatusPhase.Failed,
          ready: false
        },
        resource
      );
      throw err;
    }
  }

  protected async modifiedReplicator(
    resource: ReplicatorResource,
    _meta: ResourceMetaImpl,
    oldResource?: ReplicatorResource
  ) {
    if (resource.metadata?.generation === oldResource?.metadata?.generation) {
      return;
    }
    try {
      await this.updateStatus(
        {
          message: 'modifying replicator',
          phase: ReplicatorStatusPhase.Pending,
          ready: false
        },
        resource
      );
      const replicator = new Replicator(resource);
      await replicator.apply();
      await this.updateStatus(
        {
          message: 'modified replicator',
          phase: ReplicatorStatusPhase.Succeeded,
          ready: true
        },
        resource
      );
    } catch (err) {
      await this.updateStatus(
        {
          message: err.message?.toString() || '',
          phase: ReplicatorStatusPhase.Failed,
          ready: false
        },
        resource
      );
      throw err;
    }
  }

  protected async init() {
    this.watchResource(
      ReplicatorOperator.resource2Group(ResourceGroup.Replicator),
      ResourceVersion.V1alpha1,
      ReplicatorOperator.kind2Plural(ResourceKind.Replicator),
      async (e) => {
        const {
          oldResource,
          newResource
        } = this.resourceTracker.rotateResource(e.object);
        try {
          if (e.type === ResourceEventType.Deleted) return;
          switch (e.type) {
            case ResourceEventType.Added: {
              await this.addedReplicator(newResource, e.meta, oldResource);
              break;
            }
            case ResourceEventType.Modified: {
              await this.modifiedReplicator(newResource, e.meta, oldResource);
              break;
            }
          }
        } catch (err) {
          this.spinner.fail(
            [
              err.message || '',
              err.body?.message || err.response?.body?.message || ''
            ].join(': ')
          );
          if (this.config.debug) this.log.error(err);
        }
      }
    ).catch(console.error);
  }

  async updateStatus(
    status: ReplicatorStatus,
    resource: ReplicatorResource
  ): Promise<void> {
    this.setResourceStatus;
    if (!resource.metadata?.name || !resource.metadata.namespace) return;
    await this.customObjectsApi.patchNamespacedCustomObjectStatus(
      ReplicatorOperator.resource2Group(ResourceGroup.Replicator),
      ResourceVersion.V1alpha1,
      resource.metadata.namespace,
      ReplicatorOperator.kind2Plural(ResourceKind.Replicator),
      resource.metadata.name,
      [
        {
          op: 'replace',
          path: '/status',
          value: status
        }
      ],
      undefined,
      undefined,
      undefined,
      {
        headers: { 'Content-Type': 'application/json-patch+json' }
      }
    );
  }

  static resource2Group(group: string) {
    return `${group}.${project.domain}`;
  }

  static kind2Plural(kind: string) {
    const lowercasedKind = kind.toLowerCase();
    if (lowercasedKind[lowercasedKind.length - 1] === 's') {
      return lowercasedKind;
    }
    return `${lowercasedKind}s`;
  }
}
