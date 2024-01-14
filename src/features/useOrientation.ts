import { Orientation, getOrientation } from 'get-orientation/browser'
import { useCallback, useState } from 'react'

export const useOrientation = () => {
    const [orientation, setOrientation] = useState<Orientation | undefined>()
    const detectOrientation = useCallback(
        async (input: ArrayBuffer | File | Blob) => {
            const orientation = await getOrientation(input)
            setOrientation(orientation)
        },
        []
    )

    return {
        orientation,
        detectOrientation,
    }
}
