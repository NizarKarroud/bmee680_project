#include "stm32f4xx_hal_msp.h"
#include "stm32f4xx_hal_gpio.h"
#include "stm32f4xx_hal_tim.h"
#include "stm32f4xx_hal_uart.h"
#include "stm32f4xx_hal_i2c.h"
#include "leds.h"
#include "sw.h"
#include "lm75.h"
#include "stm32f4xx_hal.h"

#include <stdio.h>
#include <string.h>
#include "bme68x.h"
#include "bme680_port.h"
#include "bme68x_defs.h"

TIM_HandleTypeDef htim3;
TIM_HandleTypeDef htim5;
UART_HandleTypeDef huart2;
I2C_HandleTypeDef hi2c1;
struct bme68x_dev bme;
struct bme68x_conf conf;

//===========================================================
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    switch(GPIO_Pin)
    {
    }
}
//============================================================
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if(huart == &huart2)
    {
    }
}
//============================================================
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{

}


//============================================================
int main()
{
    HAL_Init();
    HAL_MspInit();

    hi2c1.Instance        = I2C1;
    hi2c1.Init.ClockSpeed = 400000;
    HAL_I2C_Init(&hi2c1);

    huart2.Instance          = USART2;
    huart2.Init.BaudRate     = 115200;
    huart2.Init.WordLength   = UART_WORDLENGTH_8B;
    huart2.Init.StopBits     = UART_STOPBITS_1;
    huart2.Init.Parity       = UART_PARITY_NONE;
    huart2.Init.Mode         = UART_MODE_TX_RX;
    huart2.Init.HwFlowCtl    = UART_HWCONTROL_NONE;
    HAL_UART_Init(&huart2);

    bme.read = bme68x_i2c_read;
    bme.write   = bme68x_i2c_write;
	bme.delay_us = bme68x_delay_us;
	bme.intf    = BME68X_I2C_INTF;
	bme.intf_ptr = &hi2c1;

	int8_t rslt = bme68x_init(&bme);

	conf.os_temp = BME68X_OS_4X;
	conf.os_pres = BME68X_OS_16X;
	conf.os_hum  = BME68X_OS_4X;
	conf.filter  = BME68X_FILTER_SIZE_3;
	conf.odr     = BME68X_ODR_NONE;
	bme68x_set_conf(&conf, &bme);

	struct bme68x_heatr_conf heatr_conf;
	heatr_conf.enable     = BME68X_ENABLE;
	heatr_conf.heatr_temp = 320;
	heatr_conf.heatr_dur  = 100;
	bme68x_set_heatr_conf(BME68X_FORCED_MODE, &heatr_conf, &bme);


	struct bme68x_data data;




	while(1)
	{
	    bme68x_set_op_mode(BME68X_FORCED_MODE, &bme);

	    uint32_t del_us = bme68x_get_meas_dur(BME68X_FORCED_MODE, &conf, &bme)
	                    + (heatr_conf.heatr_dur * 1000);
	    bme.delay_us(del_us, bme.intf_ptr);

	    uint8_t n_fields;
	    bme68x_get_data(BME68X_FORCED_MODE, &data, &n_fields, &bme);

	    if (n_fields > 0)
	    {
	    	uart_printf(&huart2, (uint8_t*)"Temp: %f C\r\n", data.temperature);
	    	uart_printf(&huart2, (uint8_t*)"Hum:  %f %%\r\n", data.humidity);
	    	uart_printf(&huart2, (uint8_t*)"Pres: %f hPa\r\n", data.pressure / 100.0f);

	    	if (data.status & BME68X_HEAT_STAB_MSK)
	    	    uart_printf(&huart2, (uint8_t*)"Gas:  %d Ohm\r\n", (int)data.gas_resistance);

	    	uart_puts(&huart2, (uint8_t*)"----------------------\r\n");
	    }

	    HAL_Delay(1000);
	}
    return 0;
}
