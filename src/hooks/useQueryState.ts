import { useEffect, useState } from 'react'


export function useQueryState<T>(key: string, initial: T, parser: (v: string) => T, serializer: (v: T) => string) {
const [value, setValue] = useState<T>(() => {
const params = new URLSearchParams(window.location.search)
const raw = params.get(key)
return raw !== null ? parser(raw) : initial
})


useEffect(() => {
const params = new URLSearchParams(window.location.search)
if (value !== initial) params.set(key, serializer(value))
else params.delete(key)
const newUrl = `${window.location.pathname}?${params.toString()}`
window.history.replaceState({}, '', newUrl)
}, [key, value])


return [value, setValue] as const
}