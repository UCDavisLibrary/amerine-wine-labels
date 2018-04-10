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
  schema: 'http://schema.org/',
	w: 'http://library.ucdavis.edu/wine-ontology#',
//		p: 'http://www.wikidata.org/prop/',
//		ps: 'http://www.wikidata.org/prop/statement/',
//		pq: 'http://www.wikidata.org/prop/qualifier/',
//		rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
//		bd: 'http://www.bigdata.com/rdf#',
	//		wd: 'http://www.wikidata.org/entity/',
//  foaf: 'http://xmlns.com/foaf/0.1/',
//	gv: 'http://google.com/google-vision/',
		wdt: 'http://www.wikidata.org/prop/direct/',
//		wikibase: 'http://wikiba.se/ontology#',
	rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
}

/* Label This is no longer used as a direct input
*/
function label_this() {
  let l;
  try {
		l = jf.readFileSync(path.join(dir,"label_this.json"));
	} catch (err) {
		warnl.push(`label_this.json`);
	}

  try {
		label_txt=v.text[0].desc ;
		add('','w:bagOfWords',`"${label_txt}"@${m.inLanguage}`);
	} catch (err) {
		warnl.push(`label_this.text[0]`);
	}
}

/*
   Google Vision No longer used directly.  It's added as a special file directly.
*/

function google_vision() {
  let v;
	try {
		v=jf.readFileSync(path.join(dir,"google-vision.json"));
	} catch (err) {
		warnl.push(`google-vision.json`);
	}

	let label_txt;
	try {
		label_txt=v.text[0].desc ;
		add('','w:bagOfWords',`"${label_txt}"@${m.inLanguage}`);
	} catch (err) {
		warnl.push(`google-vision.text[0]`);
	}

	try {
		v.properties.colors.forEach((c)=>{
			let lab=[];
			['hex','red','blue','green','score','coverage']
				.forEach((p)=>{ lab.push({"predicate":`gv:${p}`,'object':'"'+c[p]+'"'}); });
			add('','gv:color',writer.blank(lab));
		})
	} catch(err) {
		warnl.push(`google-vision.properties.color ${err}`);
	}

	try {
		v.labels.forEach((c)=>{
			let lab=[{
				predicate:`gv:mid`,
				object:'https://g.co/kg'+c.mid}];
			['desc','score']
				.forEach((p)=>{ lab.push({"predicate":`gv:${p}`,'object':'"'+c[p]+'"'}); });
			add('','gv:label',writer.blank(lab));
		})
	} catch(err) {
		warnl.push(`google-vision.labels ${err}`);
	}

}

function add_ttl (dir) {
	let errl=[];
	let warnl=[];

	let writer=n3.Writer({prefixes: prefix});

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

  let identifier=path.basename(dir);

	let label_m={};
	try {
		label_m=jf.readFileSync(path.join(dir,"metadata.json"));
	} catch (err) {
		warnl.push(`${dir}/metadata.json`);
	}
	let index_m={};
	try {
		index_m=jf.readFileSync(path.join(dir,"..","metadata.json"));
	} catch (err) {
		warnl.push(`${dir}/../metadata.json`);
	}
	let m={};
	try {
		m=jf.readFileSync(path.join(dir,"..","..","metadata.json"));
	} catch (err) {
		warnl.push(`${dir}/../../metadata.json`);
	}

	add('','rdf:type','schema:VisualArtwork');
	add('','rdf:type','schema:CreativeWork');
	add('','rdf:type','schema:Menu');
	add('','rdf:type','w:WineLabel');
	add('','schema:publisher','http://id.loc.gov/authorities/names/no2008108707');
  add('','schema:publisher','"University of California, Davis. General Library. Dept. of Special Collections"') ;
  add('','schema:license','http://rightsstatements.org/vocab/InC-NC/1.0/');
  add('','schema:identifier',`"${identifier}"`);
	// Now add all metadata together
	let overwrite=['inLanguage','country','type','color'];

	overwrite.forEach((k)=>{if (index_m[k]) { m[k]=index_m[k];}});
	if (index_m.keywords) {
		if (m.keywords) {
			m.keywords.concat(index_m.keywords);
		} else {
      m.keywords=index_m.keywords
    }
	}
	overwrite.forEach((k)=>{if (label_m[k]) { m[k]=label_m[k];}});
	if (label_m.keywords) {
		if (m.keywords) {
			m.keywords.concat(label_m.keywords);
		}
	}

	if (m.keywords) {
		m.keywords.forEach((k)=>{add('','schema.keywords',`"${k}@en"`);});
	}

	if (m.inLanguage) {
		add('','schema:inLanguage',`"${m.inLanguage}"`);
	}
	// Really this might want to be a wine node, but I'm not sure
	// If we need to be that complicated
	if (m.country || m.type || m.color ) {
    //let wine=writer.createBlankNode();
    let wine='#wine';
    add('','w:describesWine',wine);
		add(wine,'rdf:type','w:Wine');
	  if (m.type) {
		  add(wine,'w:WineType','w:'+_.capitalize(m.type));
	  }
	  if (m.country) {
		  add(wine,'wdt:P297',`"${m.country}"`);
	  }
	  if (m.color) {
		  add(wine,'w:WineColor','w:'+_.capitalize(m.color));
	  }
  }

  writer.end(function (error, result) { console.log(result); });

  if (false) {
	  if ( errl.length>0 || warnl.length>0) {
		  console.error([dir,errl.join(' '),warnl.join(' ')].join(':'));
	  }
  }
}

let argv=yargs.demandCommand(1).argv;

add_ttl(argv._[0]);
