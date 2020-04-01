var ftl=require('../src/index.js');

var template1 = "<#list envelopes as envelope><div id=\"${envelope.id}\" class=\"amptpl_Block \">${envelope.title}"
+"</div><#if tipLink??><br/><a href=\"${tipLink}\">If you like this, tip this!</a>&nbsp;</#if><#if "
+"copyLink??><#if copyLinkOnClick??><a href=\"${copyLink}\" onclick=\"${copyLinkOnClick}\">copy"
+" this!</a><#else><a href=\"${copyLink}\">copy this!</a></#if></#if><hr/></#list>";

var template2 = "Teams:<br /><#list teams as team>${team.name}<ul>"
		+"<#list team.players as player><li>${player.name}</li></#list></ul></#list>";

var template3 = "<#if s?size!=0>Data:<hr /><#list s as n>${n}.</#list><#else>No data.</#if>";

console.log(JSON.stringify(ftl.parse(template1)));
console.log(JSON.stringify(ftl.parse(template2)));
console.log(JSON.stringify(ftl.parse(template3)));
