# Copyright 2020 Silicon Hills LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

MAJOR := $(shell echo $(VERSION) | cut -d. -f1)
MINOR := $(shell echo $(VERSION) | cut -d. -f2)
PATCH := $(shell echo $(VERSION) | cut -d. -f3)

.EXPORT_ALL_VARIABLES:

.PHONY: all
all: build

.PHONY: build
build:
	@docker-compose -f docker-build.yaml build $(ARGS) build
	@$(MAKE) -s +tag

.PHONY: tag
tag:
	@$(MAKE) -s +tag
+tag:
	@docker tag ${IMAGE}:latest ${IMAGE}:${MAJOR}
	@docker tag ${IMAGE}:latest ${IMAGE}:${MAJOR}.${MINOR}
	@docker tag ${IMAGE}:latest ${IMAGE}:${MAJOR}.${MINOR}.${PATCH}

.PHONY: pull
pull:
	@docker-compose -f docker-build.yaml pull $(ARGS)

.PHONY: push
push:
	@$(MAKE) -s +push
+push:
	@docker-compose -f docker-build.yaml push $(ARGS)

.PHONY: ssh
ssh:
	@$(MAKE) -s +ssh
+ssh:
	@docker ps | grep -E "$(NAME)$$" >/dev/null 2>&1 && \
		docker exec -it $(NAME) /bin/sh|| \
		docker run --rm -it --entrypoint /bin/sh $(IMAGE):latest

.PHONY: logs
logs:
	@docker-compose logs -f $(ARGS)

.PHONY: up
up:
	@$(MAKE) -s +up
+up:
	@docker-compose up $(ARGS)

.PHONY: stop
stop:
	@docker-compose stop $(ARGS)

.PHONY: clean
clean:
	-@docker-compose -f docker-compose.yaml kill
	-@docker-compose -f docker-compose.yaml down
	-@docker-compose -f docker-compose.yaml rm -v
	-@docker volume ls --format "{{.Name}}" | grep -E "$(NAME)$$" | xargs docker volume rm $(NOFAIL)
