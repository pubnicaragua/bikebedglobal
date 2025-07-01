import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const changeLanguage = async (language: string) => {
    await i18n.changeLanguage(language);
    
    // Update user's language preference in database
    if (user) {
      await supabase
        .from('profiles')
        .update({ language })
        .eq('id', user.id);
    }
  };

  return {
    t,
    language: i18n.language,
    changeLanguage,
  };
};