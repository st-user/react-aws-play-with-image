import { css } from '@emotion/css'
import { Box, Typography } from '@mui/material'
import { useState } from 'react'
import { useOrientation } from './useOrientation'

const styles = {
    image: css`
        width: 20%;
        display: block;
    `,
}

export function Picture() {
    const { orientation, detectOrientation } = useOrientation()
    const [imageSrc, setImageSrc] = useState<string | undefined>()
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Box>
                <input
                    type="file"
                    capture="user"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                            detectOrientation(file)
                            setImageSrc(URL.createObjectURL(file))
                        }
                    }}
                />
            </Box>
            <Box>
                <Typography variant="h6" component="div">
                    {orientation}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <img src={imageSrc} className={styles.image} />
            </Box>
        </Box>
    )
}
