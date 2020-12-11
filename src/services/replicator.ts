import YAML from 'js-yaml';
import { KubernetesObject } from '@kubernetes/client-node';
import { mapSeries } from 'bluebird';
import {
  ReplicatorResource,
  FromResourceQuery,
  ToResourceQuery
} from '~/types';
import Kubectl, { Output } from './kubectl';

export default class Replicator {
  private kubectl = new Kubectl();

  constructor(public resource: ReplicatorResource) {}

  async getResources({
    apiVersion,
    kind,
    name,
    namespace
  }: FromResourceQuery): Promise<KubernetesObject[]> {
    try {
      const result = await this.kubectl.get({
        stdin: YAML.safeDump({
          apiVersion,
          kind,
          metadata: {
            name,
            namespace
          }
        }),
        output: Output.Json
      });
      if (typeof result === 'string') return [];
      return result.items;
    } catch (err) {
      return [];
    }
  }

  renameResource(
    resource: KubernetesObject,
    { name, namespace }: ToResourceQuery
  ): KubernetesObject {
    return {
      ...resource,
      metadata: {
        ...(name?.length ? { name } : {}),
        ...(namespace?.length ? { namespace } : {}),
        ...(resource.metadata?.labels
          ? { labels: resource.metadata.labels }
          : {}),
        ...(resource.metadata?.annotations
          ? { annotations: resource.metadata.annotations }
          : {})
      }
    };
  }

  async apply(): Promise<void> {
    if (!this.resource.spec?.from) return;
    const resources = await this.getResources({
      namespace: this.resource.metadata?.namespace,
      apiVersion: 'v1',
      ...(this.resource.spec?.from || {})
    });
    await mapSeries(resources, async (resource: KubernetesObject) => {
      const renamedResource = this.renameResource(
        resource,
        this.resource.spec?.to || {}
      );
      await this.kubectl.apply({
        stdin: YAML.safeDump(renamedResource)
      });
    });
  }
}
