# Configuration des Emails Supabase

## 🎯 Objectif
Configurer l'envoi automatique d'emails pour :
- ✅ Validation de compte après inscription
- ✅ Réinitialisation de mot de passe

## 📝 Configuration dans Supabase Dashboard

### 1. Activer l'envoi d'emails de confirmation

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet **kracradio**
3. Allez dans **Authentication** → **Settings** → **Email Auth**
4. Assurez-vous que ces options sont configurées :

   ```
   ✅ Enable email confirmations
   ✅ Enable email change confirmations (optionnel)
   ✅ Secure email change (recommandé)
   ```

### 2. Configuration des URLs de redirection

Dans **Authentication** → **URL Configuration** :

1. **Site URL** : Votre URL de production
   ```
   https://kracradio.com
   ```

2. **Redirect URLs** : Ajoutez ces URLs (une par ligne)
   ```
   http://localhost:3000/auth/verify-email
   http://localhost:3000/auth/update-password
   https://kracradio.com/auth/verify-email
   https://kracradio.com/auth/update-password
   ```

### 3. Templates d'emails (optionnel mais recommandé)

Dans **Authentication** → **Email Templates**, personnalisez les templates :

#### A. Email de Confirmation (Confirm signup)
```html
<h2>Bienvenue sur KracRadio!</h2>
<p>Merci de vous être inscrit. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
<p>Ou copiez ce lien dans votre navigateur :</p>
<p>{{ .ConfirmationURL }}</p>
```

#### B. Email de Réinitialisation (Reset password)
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe pour KracRadio.</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
<p>Ce lien expirera dans 24 heures.</p>
```

### 4. Configuration SMTP personnalisée (optionnel)

Si vous voulez utiliser votre propre serveur SMTP au lieu de celui de Supabase :

1. Allez dans **Project Settings** → **Auth** → **SMTP Settings**
2. Activez **Enable Custom SMTP**
3. Configurez :
   ```
   Sender email: noreply@kracradio.com
   Sender name: KracRadio
   Host: smtp.votreserveur.com
   Port: 587
   Username: votre_username
   Password: votre_password
   ```

## 🔧 Code déjà implémenté

### Inscription avec email de confirmation
Le code dans `AuthContext.jsx` envoie maintenant un email de confirmation :

```javascript
const signUp = async ({ email, password }) => {
  const options = {
    emailRedirectTo: `${process.env.REACT_APP_URL}/auth/verify-email`
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options
  });
  // ...
};
```

### Réinitialisation de mot de passe
Le code dans `AuthResetPassword.jsx` envoie déjà l'email :

```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.REACT_APP_URL}/auth/update-password`
});
```

## ✅ Vérification

Pour tester :

1. **Inscription** :
   - Créez un nouveau compte
   - Vérifiez votre boîte email (et spam)
   - Cliquez sur le lien de confirmation
   - Vous serez redirigé vers `/auth/verify-email`

2. **Reset mot de passe** :
   - Allez sur `/auth/reset-password`
   - Entrez votre email
   - Vérifiez votre boîte email
   - Cliquez sur le lien
   - Vous serez redirigé vers `/auth/update-password`

## 🐛 Dépannage

### Les emails ne sont pas envoyés
1. Vérifiez que "Enable email confirmations" est activé
2. Vérifiez les URLs de redirection autorisées
3. Regardez les logs dans Supabase Dashboard → Logs → Auth Logs

### Les emails arrivent dans spam
- Configurez un serveur SMTP personnalisé avec votre domaine
- Ajoutez des enregistrements SPF, DKIM et DMARC pour votre domaine

### Variables d'environnement
Assurez-vous que `.env.local` contient :
```bash
REACT_APP_URL=http://localhost:3000  # ou votre URL de production
REACT_APP_SUPABASE_URL=votre_url_supabase
REACT_APP_SUPABASE_ANON_KEY=votre_anon_key
```

## 📚 Documentation Supabase
- [Email Auth](https://supabase.com/docs/guides/auth/auth-email)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
