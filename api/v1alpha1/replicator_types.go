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

package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ReplicatorSpec defines the desired state of Replicator
type ReplicatorSpec struct {
	// replicate from resource
	From ResourceQuery `json:"from,omitempty"`

	// replicate to resource
	To ResourceQuery `json:"to,omitempty"`
}

type ResourceQuery struct {
	// resource api version
	ApiVersion string `json:"apiVersion,omitempty"`

	// resource kind
	Kind string `json:"kind,omitempty"`

	// resource name
	Name string `json:"name,omitempty"`

	// resource namespace
	Namespace string `json:"namespace,omitempty"`
}

// ReplicatorStatus defines the observed state of Replicator
type ReplicatorStatus struct {
	// replicator message
	Message string `json:"message,omitempty"`

	// replicator phase (Pending, Succeeded, Failed, Unknown)
	Phase string `json:"phase,omitempty"`

	// replicator ready
	Ready bool `json:"ready,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// Replicator is the Schema for the replicators API
type Replicator struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ReplicatorSpec   `json:"spec,omitempty"`
	Status ReplicatorStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ReplicatorList contains a list of Replicator
type ReplicatorList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Replicator `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Replicator{}, &ReplicatorList{})
}
