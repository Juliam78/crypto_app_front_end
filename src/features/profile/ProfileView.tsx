import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Avatar } from '../../components/shared'
import { profileSchema, type ProfileForm } from '../../lib/validation'
import type { AppUser } from '../../shared/types'

export function ProfileView({
  user,
  onSave,
}: {
  user: AppUser
  onSave: (values: ProfileForm, avatarFile?: File | null) => Promise<AppUser | null>
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Vista previa local de la imagen elegida (no se sube a BD hasta pulsar Guardar).
  useEffect(() => {
    if (!avatarFile) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
    },
  })

  return (
    <section className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
      <h2 className="text-lg font-black">Perfil</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const parsed = profileSchema.safeParse(values)
          if (!parsed.success) return
          const updated = await onSave(parsed.data, avatarFile)
          if (updated) {
            setAvatarFile(null) // limpia el preview; el Avatar mostrará ya la imagen guardada
          }
          setMessage(updated ? 'Perfil actualizado correctamente' : 'No fue posible guardar el perfil')
        })}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {preview ? (
            <img
              alt="Vista previa del avatar"
              className="h-24 w-24 rounded-full object-cover ring-2 ring-sky-300"
              src={preview}
            />
          ) : (
            <Avatar user={user} size="lg" />
          )}
          <label className="block text-sm font-semibold">
            Avatar
            <input
              accept="image/*"
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-bold file:text-white"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            {preview && (
              <span className="mt-1 flex items-center gap-2 text-xs font-normal text-amber-700">
                Vista previa · aún sin guardar
                <button
                  className="font-bold text-sky-700 underline hover:text-sky-900"
                  onClick={() => setAvatarFile(null)}
                  type="button"
                >
                  Cancelar
                </button>
              </span>
            )}
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nombre
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" {...register('name')} />
            {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
          </label>
          <label className="block text-sm font-semibold">
            Correo
            <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" {...register('email')} />
            {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Nueva contrasena
          <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" placeholder="Dejala vacia para conservar la actual" type="password" {...register('password')} />
        </label>
        {message && <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">{message}</p>}
        <button className="w-fit rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={isSubmitting}>
          Guardar perfil
        </button>
      </form>
    </section>
  )
}
