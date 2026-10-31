import React from 'react';

const K = ({ children }) => <span style={{ font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)' }}>{children}</span>;
const H2 = ({ children }) => <h2 style={{ margin: '12px 0 0', font: '400 36px/1.15 var(--font-sans)', letterSpacing: '-0.03em', color: 'var(--text-1)', textWrap: 'balance', maxWidth: 640 }}>{children}</h2>;
const P = ({ children, style }) => <p style={{ margin: 0, font: '400 15px/1.65 var(--font-sans)', color: 'var(--text-2)', textWrap: 'pretty', ...style }}>{children}</p>;
const H3 = ({ children }) => <h3 style={{ margin: '0 0 10px', font: '500 15px/1.3 var(--font-sans)', color: 'var(--text-1)' }}>{children}</h3>;
const Head = ({ k, t }) => <div style={{ marginBottom: 36 }}><K>{k}</K><H2>{t}</H2></div>;
const Card = ({ children }) => <article style={{ padding: 24, borderRadius: 'var(--r-3)', background: 'var(--bg-panel)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>{children}</article>;

function Overview() {
  return <>
    <Head k="Meet Flow" t="Your choices. An open-ended soundtrack." />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 64 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <P>I’m Chris, an interactive artist. I made Flow because I wanted a little corner of the internet that felt good to spend time in. Flow is an instrument for making ambient music in your browser. You choose the sounds, chords, layers and motion, then play by hand or let Automatic droplets explore the musical space you’ve shaped.</P>
        <P>That’s what “authored by humans” means here: a person gives the music its direction. Flow brings those choices to life as you listen. Make it the background to your day: a companion for relaxing, meditation, studying or sleeping. Leave Automatic droplets on and the live music can keep unfolding in new combinations, without repeating a fixed recording. Stay for a few minutes or let your musical scene keep you company for hours.</P>
        <P>Flow is free to use. There are no ads, and there never will be. You don’t need to sign up to listen, play or save recordings in your browser. An account is only for sharing music and voting on other people’s songs.</P>
        <P style={{ color: 'var(--text-3)' }}>Created by <a href="https://the816.com">Chris Riebschlager ↗</a></P>
      </div>
      <Card>
        <K>Your first few moments</K>
        <ol style={{ listStyle: 'none', margin: '20px 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[['Start a session', 'Choose New session, then press Play. Automatic droplets will get the music going.'], ['Find your vibe', 'Choose a soundscape. Add rain or a gentle pulse if you like.'], ['Let it unfold', 'Keep the tab open while you relax, meditate, study or drift off.']].map(([t, d], i) => (
            <li key={t} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 8 }}>
              <span style={{ font: '400 12px/1.6 var(--font-mono)', color: 'var(--text-3)' }}>0{i + 1}</span>
              <div><div style={{ font: '500 14px/1.4 var(--font-sans)' }}>{t}</div><div style={{ font: '400 13px/1.5 var(--font-sans)', color: 'var(--text-2)' }}>{d}</div></div>
            </li>
          ))}
        </ol>
        <Button variant="primary" iconRight={<Icon name="arrow-up-right" size={14} />} onClick={() => (location.href = 'index.html')}>Start your own flow</Button>
      </Card>
    </div>
  </>;
}

function Playing() {
  const items = [['A rhythm beneath the color', 'Want a little rhythm under the music? In Layers, switch on Percussion and choose a groove. Keep it soft in Mix, or open the beat studio to make it your own. Four voices and sixteen steps give you room to explore; leaving a few steps empty can feel lovely, too.'],
    ['A world behind the music', 'Try Soft rain for a quiet afternoon, Tidal shore for a little distance, or Canopy wind, Summer night and Hearth for somewhere else to be. You’ll find them under Layers → Atmospherics. Activity brings out the details, Tone makes them warmer or crisper, and Mix sets how close they feel. These environments are made in your browser rather than played from field recordings.'],
    ['Play with your whole hand', 'You’re welcome to just listen. When you want to join in, tap the canvas for a note or drag for a ribbon of color and sound. Slow strokes linger; quick ones add a little sparkle. Hold and release for a bloom, or draw circles to stir things around. The Play tab has a gesture guide and finer controls. Turn Automatic droplets off whenever you want the canvas to yourself.']];
  return <>
    <Head k="Make yourself at home" t="As little or as much as you like." />
    <P style={{ maxWidth: 720, marginBottom: 32 }}>Listen to a community song on the home page, or choose New session to make your own. Press Play, and let Automatic droplets do their thing. In Sound, pick a soundscape that suits your mood. Layers adds little melodies, percussion or rain and other atmospheres; Mix lets you soften each layer. You can stop there and get on with your day. If you feel like exploring, Play has hands-on tools and Scene has colors and motion. There’s no need to know music theory or get anything right.</P>
    <div style={{ maxWidth: 720, borderBottom: '1px solid var(--line)' }}>
      {items.map(([t, d], i) => <Fold key={t} title={`0${i + 1}   ${t}`} defaultOpen={i === 0}><P>{d}</P></Fold>)}
    </div>
  </>;
}

function Sound() {
  return <>
    <Head k="Under the surface" t="A scene that keeps finding its way." />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card><H3>Music made in the moment</H3><P style={{ fontSize: 14 }}>Your musical choices come to life in your browser as you listen. Automatic droplets choose fresh notes and positions within the harmony, so a live scene can keep changing rather than replaying a fixed track. Chords and rhythmic patterns can return while the music around them takes a different path. Choose soft keys, warm strings, airy voices or stranger textures, then give them a little reverb and space. Instrument sounds come from <a href="https://github.com/surikov/webaudiofont">WebAudioFont</a> by Sergey Surikov and the FluidR3 GM soundfont by Frank Wen; the samples and playback engine are served with Flow.</P></Card>
      <Card><H3>A little color to drift with</H3><P style={{ fontSize: 14 }}>Each droplet brings a note and a little color into moving water. Currents carry the ink, chords shift the light, and the scene finds its own pace. Watch for a while, try Zen view, or let the music sit in the background while you do something else.</P>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)', font: 'italic 400 20px/1.35 var(--font-serif)', color: 'var(--accent)' }}>Every droplet brings color, momentum, and a note into the same living canvas.</div></Card>
    </div>
  </>;
}

function Community() {
  return <>
    <Head k="Record & connect" t="Music feels personal. Share a little of yours." />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      <Card><H3>No account needed to enjoy Flow</H3><P style={{ fontSize: 14 }}>Listening, playing and saving recordings in this browser are all free and open to everyone. Sign in with ChatGPT only when you want to share a recording or vote on someone else’s music with a like. Your account email is never shown.</P></Card>
      <Card><H3>A friendly place to find music</H3><P style={{ fontSize: 14 }}>Browse ambient recordings made and shared by other Flow users. Each one carries someone’s choices of sounds, harmony and performance. Today shows likes since midnight UTC, This week covers the last seven days, and All time counts all active likes. New discoveries puts the freshest music first. Public names and titles get a basic text check to help keep the place welcoming.</P></Card>
      <Card><H3>Keep a moment for later</H3><P style={{ fontSize: 14 }}>Record a stretch you love and play it back as a loop. Saved and shared recordings repeat their captured notes; a live scene with Automatic droplets can keep making new combinations. Your library stays in this browser, so download a session file to keep a copy. WAV export makes an audio file on your device in real time. Shared sessions contain notes, settings, gestures and visuals, up to 8 MB, rather than uploaded audio.</P></Card>
    </div>
  </>;
}

function Credits() {
  return <>
    <Head k="Source & thanks" t="Made with care, and a little help." />
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <P>This application is available under the <a href="#">GNU General Public License, version 3</a>. You can <a href="https://github.com/riebschlager/flow">view the complete source on GitHub</a>.</P>
      <P>Third-party notices: <a href="#">WebAudioFont</a> · <a href="#">WebAudioFont data</a> · <a href="#">FluidR3 GM</a>.</P>
      <H3>Using your music</H3>
      <P>Export a clip or WAV from your Library to keep a copy on your device. Exports are made locally and are not uploaded. Before using a render in your own content, review the notices for Flow and its instrument sources.</P>
    </div>
  </>;
}

const SECTIONS = [['overview', 'Overview', Overview], ['playing', 'Getting started', Playing], ['sound', 'Sound & visuals', Sound], ['community', 'Community', Community], ['credits', 'Credits', Credits]];

export function AboutPage() {
  const [tab, setTab] = React.useState('overview');
  const S = SECTIONS.find(s => s[0] === tab)[2];
  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 48px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0', borderBottom: '1px solid var(--line)' }}>
        <a href="index.html" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--voice-1)"><path d="M12 3C10 6 5 11 5 15a7 7 0 0 0 14 0c0-4-5-9-7-12Z" /></svg>
          <span style={{ font: '500 18px/1 var(--font-sans)', letterSpacing: '-0.03em', color: 'var(--text-1)' }}>Flow</span>
          <span style={{ marginLeft: 6 }}><K>Infinite ambient music</K></span>
        </a>
        <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-up-right" size={13} />} onClick={() => (location.href = 'index.html')}>Back to the flow</Button>
      </header>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', alignItems: 'center', gap: 40, padding: '64px 0 56px' }}>
        <div>
          <K>A note from the maker</K>
          <h1 style={{ margin: '18px 0 22px', font: '400 64px/1.02 var(--font-sans)', letterSpacing: '-0.04em' }}>Music that unfolds.<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', letterSpacing: '-0.01em' }}>A human touch.</em></h1>
          <P>infinite ambient music in your browser.<br />authored by humans.</P>
        </div>
        <div style={{ height: 380, aspectRatio: '0.88', justifySelf: 'center', background: 'url(../../assets/about-ambient.jpg) right center / auto 100% no-repeat', WebkitMaskImage: 'radial-gradient(44% 46% at 50% 47%, #000 35%, transparent 100%)', maskImage: 'radial-gradient(44% 46% at 50% 47%, #000 35%, transparent 100%)' }} />
      </section>
      <div style={{ position: 'sticky', top: 0, background: 'var(--bg-app)', zIndex: 2 }}>
        <Tabs items={SECTIONS.map(([id, label], i) => ({ id, label: `0${i + 1}  ${label}` }))} value={tab} onChange={setTab} />
      </div>
      <main key={tab} style={{ padding: '48px 0 96px', animation: 'flowFadeIn var(--dur-3) var(--ease-out)' }}><S /></main>
      <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 0 40px', borderTop: '1px solid var(--line)', font: '400 12px/1 var(--font-sans)', color: 'var(--text-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--live)' }} />Free to use. No ads, ever. Enjoy your stay.</span>
        <a href="https://the816.com" style={{ color: 'var(--text-2)' }}>Created by Chris Riebschlager ↗</a>
      </footer>
    </div>
  );
}
