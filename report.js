/* In-browser pool-heating report. Uses the vendored jsPDF build (MIT).
   Sharing stays on the device: no fetch, no notification. */
(function(){
  var QUOTE="https://evoheat.com.au/pool-heating-quote/";
  function status(msg){
    var el=document.getElementById("share-report-status");
    if(el) el.textContent=msg||"";
  }
  function safe(s){
    return String(s||"")
      .replace(/\u2013|\u2014/g,"-")
      .replace(/\u2018|\u2019/g,"'")
      .replace(/\u201c|\u201d/g,'"')
      .replace(/\u00a0/g," ")
      .replace(/[ \t]+\n/g,"\n")
      .trim();
  }
  function heaters(){
    var nodes=[].slice.call(document.querySelectorAll("div"));
    var sticky=nodes.find(function(d){
      var style=d.getAttribute("style")||"";
      return style.indexOf("sticky")>=0 && (d.innerText||"").indexOf("Yearly running cost")>=0;
    });
    if(!sticky) return "";
    return safe(sticky.innerText).replace(/\nHide$/,"");
  }
  function build(){
    if(!window.jspdf||!window.jspdf.jsPDF) throw new Error("PDF library did not load.");
    var doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",compress:false});
    var margin=48, width=595.28-margin*2, y=margin, pageH=841.89;
    function ensure(h){
      if(y+h>pageH-margin){ doc.addPage(); y=margin; }
    }
    function write(text, size, gap, bold){
      var body=safe(text);
      if(!body) return;
      doc.setFont("helvetica", bold?"bold":"normal");
      doc.setFontSize(size);
      var lines=doc.splitTextToSize(body, width);
      var lineH=size+3;
      var i=0;
      while(i<lines.length){
        var room=Math.max(1, Math.floor((pageH-margin-y)/lineH));
        var chunk=lines.slice(i, i+room);
        doc.text(chunk, margin, y);
        y+=chunk.length*lineH;
        i+=chunk.length;
        if(i<lines.length){ doc.addPage(); y=margin; }
      }
      y+=gap||8;
    }
    var titleEl=document.querySelector("main h1");
    var title=titleEl?titleEl.textContent:"Pool heating report";
    var now=new Date();
    var stamp=now.toLocaleString("en-AU",{day:"numeric",month:"long",year:"numeric"});
    write(title, 16, 4, true);
    write(stamp, 11, 12, false);
    var picked=heaters();
    if(picked){
      write("Recommended heaters", 13, 4, true);
      write(picked, 11, 12, false);
    }
    ["location-and-season","pool-and-site","pool-cover","heat-pump-and-tariff","results","running-cost-by-month"].forEach(function(id){
      var el=document.getElementById(id);
      if(el) write(el.innerText, 11, 12, false);
    });
    var foot=document.querySelector("main footer");
    write("Disclaimer", 13, 4, true);
    if(foot) write(foot.innerText, 10, 8, false);
    write("If a manufacturer guarantee is required, visit "+QUOTE, 11, 8, false);
    var name="Pool-heating-report-"+now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")+".pdf";
    return {doc:doc, name:name, title:safe(title)};
  }
  window.__evoShareReport=async function(){
    status("");
    try{
      var built=build();
      var blob=built.doc.output("blob");
      var file=new File([blob], built.name, {type:"application/pdf"});
      var payload={files:[file], title:built.title||"Pool heating report"};
      var can=false;
      try{ can=!!(navigator.canShare&&navigator.canShare(payload)); }
      catch(e){ can=false; }
      if(can){
        try{ await navigator.share(payload); }
        catch(e){ if(e&&e.name==="AbortError") return; throw e; }
        return;
      }
      built.doc.save(built.name);
    }catch(e){
      status("The report could not be shared. Try again.");
    }
  };
})();
