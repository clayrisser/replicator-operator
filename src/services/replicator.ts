import { ReplicatorResource } from '~/types';

export default class Replicator {
  constructor(public resource: ReplicatorResource) {}

  async apply(): Promise<void> {}
}
