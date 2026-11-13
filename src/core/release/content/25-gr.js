// The release's event pack 25 of 30 (2 events, mostly gr_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const ST = ctx=>A.style(ctx.sid),
      myStyle = (p,ctx)=>(!ctx.sid&&p.school&&(ctx.sid=p.school.style),A.style(ctx.sid)),
      rk = (p,ctx)=>((p.styles||{})[ctx.sid]||{rank:1}).rank;
    A.gradingFoe=function(p,sid,bump){const st=A.style(sid),r=((p.styles||{})[sid]||{rank:1}).rank,tier=A.clamp(1+r+(bump||0),2,5),troop={sword:"HI",spear:"SP",axe:"AX",bow:"AR",unarmed:"LI",dagger:"LI",lance:"HC",mounted:"HC",dualwield:"LI"}[st&&st.prof]||"HI",f=A.makeFoe({realm:st&&st.realm||p.realm,tier,troop,title:`a senior of ${p.school?p.school.name:"the school"}`});if(st){f.styles={},A.learnStyle(f,sid,Math.min(5,r+1));const k=st.prof;GD.SKILLS[k]&&(f.skills[k]=Math.max(f.skills[k]||0,20+r*14+A.ri(-6,8)))}return f};
    A.DUEL_END.grading=function(D,sid){const pc=A.pc(),s=pc.styles&&pc.styles[sid],st=A.style(sid);if(!s||!st)return;D.result==="win"||D.result==="yield"?(A.styleRankUp(pc,sid),A.styleXp(pc,sid,15),A.willGrow(pc,.5,"grading"),A.fame(pc,1),A.log("The masters strike the floor with their staves. You have passed your grading.","good")):(s.gradingFail=A.S.year,s.xp=Math.max(0,(s.xp||0)-10),A.willGrow(pc,1.5,"defeat"),A.log('You fail your grading. "Next year," says the master. "Learn why you lost first."',"bad"))};
    A.DUEL_END.schoolChallenge=function(D,sid){const pc=A.pc(),st=A.style(sid);if(D.result==="win"||D.result==="yield"){if(A.fame(pc,4),st&&A.styleXp(pc,sid,25),pc.flags.schoolChamp=(pc.flags.schoolChamp||0)+1,A.log(`You defend the honor of ${pc.school?pc.school.name:"your school"}. Students carry you on their shoulders.`,"good"),pc.school&&pc.school.master){const m=A.relsOf(pc,["mentor","master"]).find(x=>x.p.alive);m&&A.addOp(m.p,pc,10)}}else A.fame(pc,-1),A.willGrow(pc,1.5,"defeat"),A.log("You lose in front of your whole school. The rival champion bows, very politely. It burns.","bad")};
    A.defEvents([
      {
        id: "gr_grading",
        trigger: !0,
        title: "The grading",
        text: (p,ctx)=>{const st=myStyle(p,ctx),r=rk(p,ctx);return`The school gathers in the long hall. The masters sit at the far end with their staves across their knees. Today you are tested for ${st?A.styleRankName(st,r+1):"the next rank"}${st?" of "+st.name:""}: a bout against a senior of the school, in front of everyone. Win, and the rank is yours${st&&(st.techniques||[]).some(t=>t.rank===r+1)?" — with its techniques: "+st.techniques.filter(t=>t.rank===r+1).map(t=>t.name).join(", "):""}. Lose, and you wait a year.`},
        choices: [
          {
            t: "Step onto the floor",
            r: "You bow to the masters, then to your opponent.",
            fx: (p,ctx)=>{const f=A.gradingFoe(p,ctx.sid,0);A.startDuelFront(p,f,{kind:"spar",lethal:!1,toYield:!0,place:"the long hall of the school",title:"The grading bout",onEnd:{fn:"grading",arg:ctx.sid}})},
          },
          {
            t: "Ask to be graded on the forms alone",
            check: {
              s: "ins",
              s2: "wil",
              d: 52,
              bonus: p=>p.school&&A.style(p.school.style)?A.skill(p,A.style(p.school.style).prof)*.25:0,
            },
            win: {
              r: "Every form clean, every turn exact. The masters confer, then nod. The rank is yours — though some juniors mutter that you never fought for it.",
              fx: (p,ctx)=>{A.styleRankUp(p,ctx.sid)},
            },
            lose: {
              r: 'Your third form wobbles. The master shakes his head: "Next year, on the floor like everyone else."',
              fx: (p,ctx)=>{const s=p.styles&&p.styles[ctx.sid];s&&(s.gradingFail=A.S.year),A.willGrow(p,1,"defeat")},
            },
          },
          {
            t: "Ask for another year of training first",
            r: 'The master shrugs. "A year is nothing. Use it." You train like a fiend.',
            fx: (p,ctx)=>{A.styleXp(p,ctx.sid,12);const st=A.style(ctx.sid);st&&A.trainSkill(p,st.prof,3);const s=p.styles&&p.styles[ctx.sid];s&&(s.gradingDue=A.S.year+1)},
          },
        ],
      },
      {
        id: "gr_challenge",
        trigger: !0,
        title: "A challenge at the gate",
        setup: (p,ctx)=>{const st=myStyle(p,ctx),others=A.allStyles().filter(x=>x.id!==ctx.sid&&x.school&&(x.kind==="national"||x.kind==="chain")&&x.realm===p.realm),rv=others.length?A.pick(others):A.pick(A.allStyles().filter(x=>x.id!==ctx.sid&&x.school));ctx.rival=rv?rv.school.name:"a rival school",ctx.rivalStyle=rv?rv.name:"another style",ctx.rsid=rv?rv.id:ctx.sid,ctx.mine=p.school?p.school.name:st?st.name:"your school"},
        text: 'A champion of {rival} stands at the gate of {mine} with a wooden sword and a loud voice. "Your school teaches dancing! Send me your best — or your second best, if your best is hiding." The master looks around the yard. Then at you.',
        choices: [
          {
            t: "Answer the challenge",
            r: "You take the wooden sword from the rack. The whole school pours into the yard.",
            fx: (p,ctx)=>{const f=A.gradingFoe(p,ctx.rsid,1);f.occ=`champion of ${ctx.rival}`,A.style(ctx.rsid)&&(f.styles={},A.learnStyle(f,ctx.rsid,A.clamp(rk(p,ctx)+1,2,5))),A.startDuelFront(p,f,{kind:"spar",lethal:!1,toYield:!0,place:"the yard of "+ctx.mine,title:`${ctx.rivalStyle} against your school`,onEnd:{fn:"schoolChallenge",arg:ctx.sid}})},
          },
          {
            t: "Answer with words first",
            check: {s:"persuasion",s2:"intimidation",d:50},
            win: {
              r: "You ask which of his masters taught him manners. The yard laughs him back down the road. No blood, all honor.",
              fx: {fame:2,styleXp:8},
            },
            lose: {
              r: "He laughs louder. Now you must fight anyway, and everyone thinks you hesitated.",
              fx: (p,ctx)=>{const f=A.gradingFoe(p,ctx.rsid,1);A.startDuelFront(p,f,{kind:"spar",lethal:!1,toYield:!0,place:"the yard of "+ctx.mine,title:`${ctx.rivalStyle} against your school`,onEnd:{fn:"schoolChallenge",arg:ctx.sid}})},
            },
          },
          {
            t: "Let a senior take it",
            r: "A senior steps up and beats him soundly. You watched closely — you learned something.",
            fx: {styleXp:6,honor:-1},
          },
        ],
      },
    ]);
  })();
})();
