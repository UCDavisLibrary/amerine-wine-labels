#!/usr/bin/make -f
SHELL:=/bin/bash

c:=fin collection

col:=amerine-wine-labels

labels:=$(shell find folder -type d -name label_*)
ttl:=$(patsubst %,%/metadata.ttl,${labels})
ldp:=$(patsubst %,%/ldp.ttl,${labels})

INFO:
	@echo ${labels}

.PHONY: ttl ldp
ttl:${ttl}
ldp:ldp.ttl ${ldp}

${ttl}:%/metadata.ttl:%
	node ttl.js $< > $@

#${labels}:%/google_vision.txt:%/google_vision.json
#	eval "echo -e $(jq '.text[0].desc' < $< )" > $*.txt

ldp.ttl: agents:= quinn enebeker
ldp.ttl: schema:=http://www.schema.org
ldp.ttl:
	$c delete -f ${col};\
	$c create ${col} index.ttl;\
  $c acl group add ${col} admins rw $(patsubst %,--agent %@ucdavis.edu,${agents});\
  $c relation add-container ${col} labels -T part;\
  $c relation add-properties ${col} ${schema}/workExample labels/label_0002 ${schema}/exampleOfWork
	fin http get -P b /$collection/${col} > $@


${ldp}:%/ldp.ttl:%/metadata.ttl
	$c resource delete ${col} labels/$(notdir $*);\
	$c resource add ${col} $< labels/$(notdir $*);\
	$c relation add-container -T media ${col} labels/$(notdir $*)/media;\
	$c resource add --type MediaObject ${col} $*/label.jpg labels/$(notdir $*)/media/$(notdir $*);\
	if [[ -e $*/google_vision.json ]]; then \
#	  $c resource add --type MediaObject ${col} $*/google_vision.json labels/$(notdir $*)/media/google_vision; \
		eval "echo -e $(jq '.text[0].desc' < $*/google_vision.json )" > $*/google_vision.txt; \
#	  $c resource add --type MediaObject ${col} $*/google_vision.txt labels/$(notdir $*)/media/google_vision_text; \
	fi; \
	if [[ -e $*/label_this.json ]]; then \
#	  $c resource add --type MediaObject ${col} $*/label_this.json labels/$(notdir $*)/media/label_this; \
		eval "echo -e $(jq '.text[0].desc' < $*/label_this.json )" > $*/label_this.txt; \
#	  $c resource add --type MediaObject ${col} $*/label_this.txt labels/$(notdir $*)/media/label_this_text; \
	fi; \
	fin http get -P b /collection/${col}/$(notdir $*) > $@
