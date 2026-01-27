
import { ui } from '../i18n/ui';

interface Props {
  lang: 'es' | 'en';
  mode: 'default' | 'focus';
}

export default function HeroSection({ lang, mode }: Props) {
  const t = (key: keyof typeof ui['es']) => ui[lang][key];

  if (mode === 'focus') {
    return (
      <div class="text-center space-y-4 mb-10 animate-fade-in-up">
         <h1 class="text-5xl font-extrabold text-primary">
            {t('hero.focus.title')}
         </h1>
         <p class="text-xl text-base-content/80 max-w-2xl mx-auto">
            {t('hero.focus.subtitle')}
         </p>
      </div>
    );
  }

  return (
    <div class="text-center space-y-4 mb-10 animate-fade-in-up">
      <h1 class="text-5xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent pb-2">
        {t('hero.title')}
      </h1>
      
      <div class="text-xl text-base-content/80 max-w-2xl mx-auto flex flex-col gap-2">
        <p>
          {t('hero.subtitle').split(',')[0]}{' '}
          <span class="text-primary font-bold">{t('hero.span.coding')}</span>,{' '}
          <span class="text-secondary font-bold">{t('hero.span.studying')}</span>{' '}
           {lang === 'es' ? 'o' : 'or'}{' '}
          <span class="text-accent font-bold">{t('hero.span.creating')}</span>
        </p>
        <p>
           {lang === 'es' ? 'el método Pomodoro es tu mejor aliado.' : 'the Pomodoro method is your best ally.'}
        </p>
      </div>
    </div>
  );
}
