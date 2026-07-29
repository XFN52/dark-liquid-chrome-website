import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './lib/gsap';
import { platform, shared } from './lib/platform';
import { useScrollLife } from './lib/useScrollLife';
import { useScramble } from './lib/useScramble';
import { Preloader } from './components/Preloader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Metrics } from './components/Metrics';
import { HowItWorks } from './components/HowItWorks';
import { Elasticity } from './components/Elasticity';
import { Pricing } from './components/Pricing';
import { Reliability } from './components/Reliability';
import { Ecosystem } from './components/Ecosystem';
import { Faq } from './components/Faq';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  // scrub-параллакс всех [data-speed] элементов
  useScrollLife([loaded]);
  // лейблы секций «декодируются» при входе в вьюпорт
  useScramble(loaded);

  // Готовность шрифтов — один из реальных гейтов прелоадера
  useEffect(() => {
    const unlock = () => { shared.fontsReady = true; };
    if (document.fonts) {
      document.fonts.ready.then(unlock).catch(unlock);
      const t = window.setTimeout(unlock, 2500); // страховка
      return () => window.clearTimeout(t);
    }
    unlock();
  }, []);

  // lenis + ScrollTrigger. При prefers-reduced-motion lenis не создаётся вовсе.
  useEffect(() => {
    if (platform.reduced) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    shared.lenis = lenis;
    lenis.on('scroll', (e: Lenis) => {
      shared.vel = e.velocity;
      ScrollTrigger.update();
    });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    if (!loaded) lenis.stop();
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      shared.lenis = null;
    };
  }, [loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !loaded);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    ScrollTrigger.refresh();
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => window.clearTimeout(t);
  }, [loaded]);

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <Header />
      <main id="main">
        <Hero start={loaded} />
        <Metrics />
        <HowItWorks />
        <Elasticity />
        <Pricing />
        <Reliability />
        <Ecosystem />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <div className="bg-lines" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
