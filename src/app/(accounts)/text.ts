// Every word the account pages and their e-mails show, in one place: translate the site by editing only this file.
export const text = {
  signIn: {
    title: 'Bienvenido de nuevo',
    lead: 'Entra para abrir la app o la oficina.',
    submit: 'Entrar',
    forgot: '¿Has olvidado la contraseña?',
    other: '¿Primera vez?',
    otherLink: 'Crear cuenta',
  },
  signUp: {
    title: 'Crea tu cuenta',
    lead: 'Quien se registra entra como conductor; el gerente asigna después los roles.',
    submit: 'Crear cuenta',
    other: '¿Ya tienes cuenta?',
    otherLink: 'Entrar',
  },
  panel: {
    title: 'Albaranes y fichajes, sin papel.',
    lead: 'Del móvil del conductor a la mesa de la oficina, también sin cobertura.',
  },
  fields: {
    name: 'Nombre',
    email: 'Correo electrónico',
    password: 'Contraseña',
    newPassword: 'Contraseña nueva',
    currentPassword: 'Contraseña actual',
    code: 'Código',
  },
  google: 'Continuar con Google',
  orEmail: 'o con tu correo',
  googleFailed: 'No se pudo completar el acceso con Google. Inténtalo de nuevo.',
  googleNotLinked:
    'Este correo ya tiene una cuenta con contraseña. Entra con ella, confirma tu correo en /account y después Google también funcionará.',
  wait: 'Espera…',
  verifyingHuman: 'Comprobando que eres una persona…',
  failed: 'Algo ha fallado. Inténtalo de nuevo.',
  passwordHint: 'Mínimo 8 caracteres.',
  /** loginfix: inside another site's frame, a browser that keeps no sign-in there */
  framedBlocked:
    'Has entrado, pero este navegador no conserva la sesión dentro de otra web. Abre la app en su propia pestaña para continuar.',
  openNewTab: 'Abrir en una pestaña nueva',
  /** ownermail: the preview's sign-in and sign-up only — its accounts live in the preview's own database */
  previewAccounts:
    'Vista previa: las cuentas creadas aquí son de prueba y se quedan en la vista previa. La app publicada tiene sus propias cuentas: regístrate de nuevo allí.',
  /** what a wrong, old or over-tried code answers (better-auth's codes) */
  codeErrors: {
    INVALID_OTP: 'El código no es correcto. Revísalo e inténtalo de nuevo.',
    OTP_EXPIRED: 'El código ha caducado. Pide uno nuevo.',
    TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Pide un código nuevo.',
  } as Partial<Record<string, string>>,
  verify: {
    title: 'Revisa tu correo',
    lead: (email: string) => `Hemos enviado un código de 8 dígitos a ${email}. Escríbelo para confirmar tu dirección.`,
    leadNoEmail: 'Escribe tu correo y el código de 8 dígitos que te hemos enviado.',
    submit: 'Confirmar correo',
    done: 'Tu correo está confirmado.',
  },
  resend: {
    send: 'Enviarme un código',
    again: 'Enviar un código nuevo',
    wait: (seconds: number) => `Código nuevo en ${String(seconds)} s`,
    sent: 'Código enviado. Vale durante 10 minutos.',
  },
  forgot: {
    title: 'Restablece tu contraseña',
    lead: 'Escribe tu correo y te enviaremos un código de 8 dígitos.',
    sendCode: 'Enviar código',
    codeLead: (email: string) =>
      `Si ${email} tiene cuenta, el código va de camino. Escríbelo junto a la contraseña nueva.`,
    submit: 'Guardar contraseña nueva',
    done: 'Tu contraseña ha cambiado. Entra con la nueva.',
    back: 'Volver a entrar',
  },
  account: {
    title: 'Tu cuenta',
    signedInWith: (methods: string) => `Has entrado con ${methods}`,
    profile: 'Perfil',
    save: 'Guardar',
    saved: 'Guardado.',
    verified: 'Confirmado',
    unverified: 'Sin confirmar',
    confirmEmail: 'Confirma tu correo',
    password: 'Contraseña',
    changePassword: 'Cambiar contraseña',
    passwordChanged: 'Contraseña cambiada. Se ha cerrado la sesión en tus otros dispositivos.',
    devices: 'Dispositivos',
    unknownDevice: 'Dispositivo desconocido',
    signOut: 'Cerrar sesión',
    adminAccess: 'Acceso de administración',
    adminLead: (email: string) => `Confirma ${email} para abrir las páginas de administración.`,
    danger: 'Eliminar cuenta',
    dangerLead: 'Se elimina tu cuenta y se cierra la sesión. No se puede deshacer.',
    deleteConfirm: 'Eliminar mi cuenta',
    deleteFailed: 'No se pudo eliminar tu cuenta. Inténtalo de nuevo o ponte en contacto con nosotros.',
  },
  email: {
    verifySubject: 'Tu código de confirmación',
    resetSubject: 'Tu código para restablecer la contraseña',
    body: (code: string) =>
      `<p>Tu código es:</p><p style="font-size:28px;font-weight:600;letter-spacing:6px;font-family:monospace">${code}</p><p>Vale durante 10 minutos. Si no lo has pedido, ignora este correo.</p>`,
  },
};
