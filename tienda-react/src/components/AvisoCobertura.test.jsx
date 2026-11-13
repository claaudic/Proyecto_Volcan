import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvisoCobertura from './AvisoCobertura'

describe('AvisoCobertura', () => {

    it('si llegamos, dice la zona, los días y el horario de reparto', () => {
        render(<AvisoCobertura comuna="chillan viejo" />)

        expect(screen.getByText('Llegamos a tu comuna: Zona Oriente, lunes a viernes de 08:00 – 18:00.'))
            .toHaveClass('aviso-cobertura-ok')
    })

    it('si no llegamos, lo avisa', () => {
        render(<AvisoCobertura comuna="Concepción" />)

        expect(screen.getByText('Todavía no tenemos reparto en esa comuna.')).toHaveClass('aviso-cobertura-no')
    })

    it('con la comuna vacía no muestra nada', () => {
        const { container } = render(<AvisoCobertura comuna="  " />)

        expect(container).toBeEmptyDOMElement()
    })

})
