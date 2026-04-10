import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import styles from '../privacy/page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms')
  return { title: t('title') }
}

export default async function TermsPage() {
  const t = await getTranslations('terms')

  return (
    <div className={styles.page}>
      <Nav showNavLinks={false} />
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>{t('title')}</h1>
        <p className={styles.heroUpdated}>{t('lastUpdated')}</p>
      </div>
      <main className={styles.content}>
        <div className={styles.section}>
          <p className={styles.text}>{t('intro')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('whatTitle')}</h2>
          <p className={styles.text}>{t('whatText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('warrantyTitle')}</h2>
          <p className={styles.text}>{t('warrantyIntro')}</p>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('warranty1')}</span></div>
            <div className={styles.listItem}><span>{t('warranty2')}</span></div>
            <div className={styles.listItem}><span>{t('warranty3')}</span></div>
          </div>
          <p className={styles.text}>{t('warrantyOutro')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('responsibilitiesTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('resp1')}</span></div>
            <div className={styles.listItem}><span>{t('resp2')}</span></div>
            <div className={styles.listItem}><span>{t('resp3')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('accountsTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('accounts1')}</span></div>
            <div className={styles.listItem}><span>{t('accounts2')}</span></div>
            <div className={styles.listItem}><span>{t('accounts3')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('calendarLinksTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('calLinks1')}</span></div>
            <div className={styles.listItem}><span>{t('calLinks2')}</span></div>
            <div className={styles.listItem}><span>{t('calLinks3')}</span></div>
            <div className={styles.listItem}><span>{t('calLinks4')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('ipTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('ip1')} (<a href="https://github.com/unibo-toolkit" className={styles.link}>github.com/unibo-toolkit</a>)</span></div>
            <div className={styles.listItem}><span>{t('ip2')}</span></div>
            <div className={styles.listItem}><span>{t('ip3')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('liabilityTitle')}</h2>
          <p className={styles.text}>{t('liabilityText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('changesTitle')}</h2>
          <p className={styles.text}>{t('changesText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('terminationTitle')}</h2>
          <p className={styles.text}>{t('terminationText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('lawTitle')}</h2>
          <p className={styles.text}>{t('lawText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('contactTitle')}</h2>
          <p className={styles.text}>{t('contactEmail')}{' '}<a href="mailto:legal@uniplanner.it" className={styles.link}>legal@uniplanner.it</a></p>
          <p className={styles.text}>{t('contactProject')}{' '}<a href="https://github.com/unibo-toolkit" className={styles.link}>github.com/unibo-toolkit</a></p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
