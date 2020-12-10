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

import { KubernetesObject } from '@kubernetes/client-node';

export interface ReplicatorSpec {}

export interface ReplicatorResource extends KubernetesObject {
  spec?: ReplicatorSpec;
  status?: ReplicatorStatus;
}

export interface ReplicatorStatus {
  message?: string; // string `json:"message,omitempty"`
  phase?: ReplicatorStatusPhase; // string `json:"phase,omitempty"`
  ready?: boolean; // bool `json:"ready,omitempty"`
}

export enum ReplicatorStatusPhase {
  Failed = 'Failed',
  Pending = 'Pending',
  Succeeded = 'Succeeded',
  Unknown = 'Unknown'
}

export enum ResourceGroup {
  Replicator = 'replicator'
}

export enum ResourceKind {
  Replicator = 'Replicator'
}

export enum ResourceVersion {
  V1alpha1 = 'v1alpha1'
}
