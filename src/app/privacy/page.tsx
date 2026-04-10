import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy')
  return { title: t('title') }
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')

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
          <h2 className={styles.sectionTitle}>{t('dataTitle')}</h2>
          <h3 className={styles.sectionSubtitle}>{t('accountDataTitle')}</h3>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('accountEmail')}</span></div>
            <div className={styles.listItem}><span>{t('accountName')}</span></div>
            <div className={styles.listItem}><span>{t('accountPicture')}</span></div>
            <div className={styles.listItem}><span>{t('accountAvatar')}</span></div>
          </div>
          <p className={styles.text}>{t('accountNoPassword')}</p>

          <h3 className={styles.sectionSubtitle}>{t('calendarDataTitle')}</h3>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('calendarCourses')}</span></div>
            <div className={styles.listItem}><span>{t('calendarLinks')}</span></div>
          </div>

          <h3 className={styles.sectionSubtitle}>{t('usageDataTitle')}</h3>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('usageIp')}</span></div>
            <div className={styles.listItem}><span>{t('usageAgent')}</span></div>
            <div className={styles.listItem}><span>{t('usageTimestamps')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('useTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('use1')}</span></div>
            <div className={styles.listItem}><span>{t('use2')}</span></div>
            <div className={styles.listItem}><span>{t('use3')}</span></div>
            <div className={styles.listItem}><span>{t('use4')}</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('storageTitle')}</h2>
          <p className={styles.text}>{t('storageText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('thirdPartyTitle')}</h2>
          <div className={styles.list}>
            <div className={styles.listItem}><span>{t('thirdPartyGoogle')}</span></div>
            <div className={styles.listItem}><span>{t('thirdPartyApple')}</span></div>
            <div className={styles.listItem}><span>{t('thirdPartyCloudflare')}</span></div>
          </div>
          <p className={styles.text}>{t('thirdPartyNoSell')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('gdprTitle')}</h2>
          <p className={styles.text}>{t('gdprText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cookiesTitle')}</h2>
          <p className={styles.text}>{t('cookiesText')}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('contactTitle')}</h2>
          <p className={styles.text}>{t('contactText')}{' '}<a href="mailto:privacy@uniplanner.it" className={styles.link}>privacy@uniplanner.it</a></p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
