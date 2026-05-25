"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ThemeToggle } from "../components/theme-toggle";
import { Locale, useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";

type PublicCopy = {
  nav: {
    home: string;
    login: string;
    register: string;
    whatsapp: string;
    menu: string;
    language: string;
    whatsappLong: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    imageLabel: string;
    imageText: string;
    proof: string[];
  };
  solutions: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ body: string; icon: string; title: string }>;
  };
  products: {
    eyebrow: string;
    title: string;
    body: string;
    items: string[];
  };
  steps: {
    eyebrow: string;
    title: string;
    items: Array<{ body: string; title: string }>;
  };
  cta: {
    eyebrow: string;
    title: string;
    body: string;
    action: string;
  };
  footer: string;
};

const whatsappUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ??
  "https://wa.me/?text=Hola%20ShopWise%2C%20quiero%20consultar%20por%20sus%20soluciones%20QR%20y%20NFC.";

const copy = {
  es: {
    nav: {
      home: "Inicio",
      login: "Login",
      register: "Register",
      whatsapp: "WhatsApp",
      menu: "Abrir menú",
      language: "Idioma",
      whatsappLong: "Contactar por WhatsApp"
    },
    hero: {
      eyebrow: "QR + NFC + soluciones inteligentes",
      title: "Conecta cada espacio físico con una acción digital.",
      body:
        "ShopWise ayuda a restaurantes, hoteles, locales y eventos a activar reseñas, WiFi, redes, reservas y experiencias personalizadas desde dispositivos QR y NFC.",
      primary: "Consultar por WhatsApp",
      secondary: "Entrar al panel",
      imageLabel: "Imagen de dispositivos ShopWise",
      imageText: "IMAGEN DISPOSITIVOS",
      proof: ["Compatible con celulares", "Configuración online", "Soporte remoto"]
    },
    solutions: {
      eyebrow: "Soluciones",
      title: "Un dispositivo, muchos objetivos",
      body: "Configurás el destino de cada dispositivo según la necesidad del cliente.",
      items: [
        {
          title: "Google Reviews",
          body: "Acerca a tus clientes a dejar una reseña con QR o NFC listo para usar.",
          icon: "★"
        },
        {
          title: "WiFi Connect",
          body: "Facilita el acceso a la red con una experiencia clara y sin fricción.",
          icon: "⌁"
        },
        {
          title: "Soluciones personalizadas",
          body: "Creamos flujos para casos específicos: eventos, reservas, campañas o accesos.",
          icon: "◇"
        },
        {
          title: "Redes y contacto",
          body: "Lleva tráfico a Instagram, WhatsApp, reservas o cualquier landing.",
          icon: "↗"
        }
      ]
    },
    products: {
      eyebrow: "Dispositivos",
      title: "Diseñados para verse premium",
      body: "Todo lo que entregamos es un dispositivo ShopWise: NFC, QR o ambos, listo para configurar y medir.",
      items: ["Dispositivo NFC", "Dispositivo QR", "Dispositivo QR + NFC", "Dispositivo personalizado"]
    },
    steps: {
      eyebrow: "Cómo funciona",
      title: "Simple para operar, sólido para escalar",
      items: [
        {
          title: "Elegís el dispositivo",
          body: "Definís si la experiencia se activa por QR, NFC o ambos."
        },
        {
          title: "Configurás el destino",
          body: "Google Reviews, WhatsApp, Instagram, WiFi, reservas o una landing propia."
        },
        {
          title: "Actualizás sin reimprimir",
          body: "Cambiá el contenido cuando quieras desde el panel."
        }
      ]
    },
    cta: {
      eyebrow: "ShopWise",
      title: "¿Listo para modernizar tu negocio?",
      body: "Hablemos por WhatsApp y vemos qué solución encaja mejor con tu operación.",
      action: "Contactar ahora"
    },
    footer: "Conectamos el mundo físico con el digital."
  },
  en: {
    nav: {
      home: "Home",
      login: "Login",
      register: "Register",
      whatsapp: "WhatsApp",
      menu: "Open menu",
      language: "Language",
      whatsappLong: "Contact on WhatsApp"
    },
    hero: {
      eyebrow: "QR + NFC + smart solutions",
      title: "Connect every physical space with a digital action.",
      body:
        "ShopWise helps restaurants, hotels, stores and events activate reviews, WiFi, social channels, bookings and custom experiences from QR and NFC devices.",
      primary: "Contact on WhatsApp",
      secondary: "Open dashboard",
      imageLabel: "ShopWise devices image",
      imageText: "DEVICES IMAGE",
      proof: ["Mobile friendly", "Online configuration", "Remote support"]
    },
    solutions: {
      eyebrow: "Solutions",
      title: "One device, many goals",
      body: "Configure each device destination based on each customer need.",
      items: [
        {
          title: "Google Reviews",
          body: "Guide customers to leave a review with a QR or NFC device ready to use.",
          icon: "★"
        },
        {
          title: "WiFi Connect",
          body: "Make network access clear, fast and frictionless.",
          icon: "⌁"
        },
        {
          title: "Custom solutions",
          body: "We create flows for specific use cases: events, bookings, campaigns or access.",
          icon: "◇"
        },
        {
          title: "Social and contact",
          body: "Drive traffic to Instagram, WhatsApp, bookings or any landing page.",
          icon: "↗"
        }
      ]
    },
    products: {
      eyebrow: "Devices",
      title: "Designed to feel premium",
      body: "Everything we deliver is a ShopWise device: NFC, QR or both, ready to configure and measure.",
      items: ["NFC device", "QR device", "QR + NFC device", "Custom device"]
    },
    steps: {
      eyebrow: "How it works",
      title: "Simple to operate, solid to scale",
      items: [
        {
          title: "Choose the device",
          body: "Define whether the experience starts with QR, NFC or both."
        },
        {
          title: "Configure the destination",
          body: "Google Reviews, WhatsApp, Instagram, WiFi, bookings or your own landing."
        },
        {
          title: "Update without reprinting",
          body: "Change the content anytime from the dashboard."
        }
      ]
    },
    cta: {
      eyebrow: "ShopWise",
      title: "Ready to modernize your business?",
      body: "Let's talk on WhatsApp and find the best solution for your operation.",
      action: "Contact now"
    },
    footer: "We connect the physical world with the digital one."
  }
} satisfies Record<Locale, PublicCopy>;

const locales: Array<{ label: string; value: Locale }> = [
  { label: "ES", value: "es" },
  { label: "EN", value: "en" }
];

export default function HomePage() {
  const { locale, setLocale } = useI18n();
  const { theme } = useTheme();
  const t = useMemo(() => copy[locale], [locale]);

  return (
    <main className={`public-site ${theme === "dark" ? "is-dark" : "is-light"}`}>
      <header className="public-nav" id="inicio">
        <Link aria-label="ShopWise inicio" className="brand-mark" href="/">
          <img alt="ShopWise" src="/brand/logo-shopwise-black.png" />
        </Link>

        <nav aria-label="Navegación principal" className="desktop-nav">
          <a href="#inicio">{t.nav.home}</a>
          <Link href="/login">{t.nav.login}</Link>
          <Link href="/register">{t.nav.register}</Link>
        </nav>

        <div aria-label={t.nav.language} className="public-language-toggle">
          {locales.map((item) => (
            <button
              aria-pressed={locale === item.value}
              className={locale === item.value ? "is-active" : undefined}
              key={item.value}
              onClick={() => setLocale(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <ThemeToggle />

        <a className="nav-whatsapp" href={whatsappUrl} rel="noreferrer" target="_blank">
          {t.nav.whatsapp}
        </a>

        <details className="mobile-menu">
          <summary aria-label={t.nav.menu}>
            <span />
            <span />
            <span />
          </summary>
          <div className="mobile-menu-panel">
            <a href="#inicio">{t.nav.home}</a>
            <Link href="/login">{t.nav.login}</Link>
            <Link href="/register">{t.nav.register}</Link>
            <a href={whatsappUrl} rel="noreferrer" target="_blank">
              {t.nav.whatsappLong}
            </a>
          </div>
        </details>
      </header>

      <section className="public-hero">
        <div className="hero-copy">
          <p className="public-eyebrow">{t.hero.eyebrow}</p>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.body}</p>
          <div className="hero-actions">
            <a className="primary-cta" href={whatsappUrl} rel="noreferrer" target="_blank">
              {t.hero.primary}
            </a>
            <Link className="secondary-cta" href="/login">
              {t.hero.secondary}
            </Link>
          </div>
          <div className="hero-proof">
            {t.hero.proof.map((proof) => (
              <span key={proof}>{proof}</span>
            ))}
          </div>
        </div>

        <div aria-label={t.hero.imageLabel} className="hero-device-placeholder">
          <span>{t.hero.imageText}</span>
          <small>ShopWise QR + NFC</small>
        </div>
      </section>

      <section className="public-section">
        <div className="section-heading">
          <p className="public-eyebrow">{t.solutions.eyebrow}</p>
          <h2>{t.solutions.title}</h2>
          <p>{t.solutions.body}</p>
        </div>
        <div className="solution-grid">
          {t.solutions.items.map((solution) => (
            <article className="solution-card" key={solution.title}>
              <span>{solution.icon}</span>
              <h3>{solution.title}</h3>
              <p>{solution.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="product-band">
        <div>
          <p className="public-eyebrow">{t.products.eyebrow}</p>
          <h2>{t.products.title}</h2>
          <p>{t.products.body}</p>
        </div>
        <div className="product-list">
          {t.products.items.map((product) => (
            <span key={product}>{product}</span>
          ))}
        </div>
      </section>

      <section className="public-section how-it-works">
        <div className="section-heading">
          <p className="public-eyebrow">{t.steps.eyebrow}</p>
          <h2>{t.steps.title}</h2>
        </div>
        <div className="steps-grid">
          {t.steps.items.map((step, index) => (
            <article key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-final-cta">
        <div>
          <p className="public-eyebrow">{t.cta.eyebrow}</p>
          <h2>{t.cta.title}</h2>
          <p>{t.cta.body}</p>
        </div>
        <a className="primary-cta" href={whatsappUrl} rel="noreferrer" target="_blank">
          {t.cta.action}
        </a>
      </section>

      <footer className="public-footer">
        <img alt="ShopWise" src="/brand/logo-shopwise-black.png" />
        <span>{t.footer}</span>
        <nav aria-label="Links de pie de página">
          <a href="#inicio">{t.nav.home}</a>
          <Link href="/login">{t.nav.login}</Link>
          <Link href="/register">{t.nav.register}</Link>
        </nav>
      </footer>
    </main>
  );
}
