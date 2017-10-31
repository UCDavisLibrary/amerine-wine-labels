#! /usr/bin/env node
'use strict';

const yargs=require('yargs')
const jf=require('jsonfile');
const fs=require('fs');
const path=require('path');
const n3=require('n3');
const n3u=n3.Util;
const _=require('lodash');

var prefix= {
		dc: 'http://purl.org/dc/elements/1.1/',
		dct: 'http://purl.org/dc/terms/',
		ebucore: 'http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#',
		foaf: 'http://xmlns.com/foaf/0.1/',
//		p: 'http://www.wikidata.org/prop/',
//		ps: 'http://www.wikidata.org/prop/statement/',
//		pq: 'http://www.wikidata.org/prop/qualifier/',
//		rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
		rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
//		bd: 'http://www.bigdata.com/rdf#',
		//		wd: 'http://www.wikidata.org/entity/',
		wdt: 'http://www.wikidata.org/prop/direct/',
//		wikibase: 'http://wikiba.se/ontology#',
		w: 'http://library.ucdavis.edu/wine-ontology#'
}

let argv=yargs.demandCommand(1).argv;


function add_ttl (dir) {
		let outfn=fs.createWriteStream(path.join(dir,"metadata.ttl"));
		let writer=n3.Writer(outfn,{prefixes: prefix});

		function add(s,p,o) {
				let pr=prefix;
				if (n3u.isPrefixedName(s))
						s=n3u.expandPrefixedName(s,pr);
				if (n3u.isPrefixedName(p))
						p=n3u.expandPrefixedName(p,pr);
				if (n3u.isPrefixedName(o))
						o=n3u.expandPrefixedName(o,pr);
				return writer.addTriple(s,p,o);
		}


		let m=jf.readFileSync(path.join(dir,"metadata.json"));
		let v=jf.readFileSync(path.join(dir,"google-vision.json"));
		let l;
		try {
				l = jf.readFileSync(path.join(dir,"label_this.json"));
		} catch (err) {
				console.log (err,path.join(dir,"label_this.json"));
		}
		add('','rdf:type','w:WineLabel');
    add('','ebucore:filename',`"${dir}.jpg`) ;
		add('','dct:publisher','http://id.loc.gov/authorities/names/no2008108707');
    add('','dc:publisher','"University of California, Davis. General Library. Dept. of Special Collections"') ;
    add('','dct:rights','http://rightsstatements.org/vocab/InC-NC/1.0/');
    add('','ebucore:hasMimeType','"image/jpeg"') ;
    add('','dc:identifier',`"${dir}"`);
    add('','dct:type','"image"');
		m.keywords.forEach((k)=>{add('','dc:subject',`"${k}@en"`);});
		let label_txt=v.text[0].desc ;
		add('','w:bagOfWords',`"${label_txt}"@${m.language_id}`);
		if (l.text[0].desc) {
				label_txt=l.text[0].desc ;
				add('','w:bagOfWords',`"${label_txt}"@${m.language_id}`);
		}
		if (m.language_id) {
				add('','wdt:P219',`"${m.language_id}"`);
		}
		if (m.country_id || m.type ) {
				let wine='#wine';
				add('','w:Wine',wine);
//				let wine=writer.createBlankNode();
				add(wine,'rdf:type','w:Wine');
				if (m.type) {
						add(wine,'w:WineType','w:'+_.capitalize(m.type));
				}
				if (m.country_id) {
						add(wine,'wdt:P298',`"${m.country_id}"`);
				}
				if (m.color) {
						add(wine,'w:WineColor','w:'+_.capitalize(m.color));
				}
		}
		writer.end();
//		writer.end(function (error, result) { console.log(result); });
}

argv._.forEach((f) => add_ttl(f) );
