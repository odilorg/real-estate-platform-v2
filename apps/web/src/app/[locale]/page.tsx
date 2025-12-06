import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@repo/ui';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">{t('description')}</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button>{t('signInButton')}</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">{t('createAccountButton')}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
