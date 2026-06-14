
#include "stm32f4xx_hal_i2c.h"

#include "bme680_port.h"

#include "bme68x_defs.h"

int8_t bme68x_i2c_read(uint8_t reg_addr, uint8_t *reg_data,
                         uint32_t len, void *intf_ptr)
{
    I2C_HandleTypeDef *hi2c = (I2C_HandleTypeDef *)intf_ptr;
    uint8_t buf[len + 1];
    buf[0] = reg_addr;

    int status = HAL_I2C_Master_Transmit_Receive_IT(
                     hi2c,
                     BME68X_I2C_ADDR,   
                     buf,
                     1,                  
                     len,                
                     0
                 );

    if (status != I2C_OK) return -1;

    for (uint32_t i = 0; i < len; i++)
        reg_data[i] = buf[i];

    return 0;
}


int8_t bme68x_i2c_write(uint8_t reg_addr, const uint8_t *reg_data,
                          uint32_t len, void *intf_ptr)
{
    I2C_HandleTypeDef *hi2c = (I2C_HandleTypeDef *)intf_ptr;

    uint8_t buf[len + 1];

    buf[0] = reg_addr;                          
    for (uint32_t i = 0; i < len; i++)
        buf[i + 1] = reg_data[i];              

    int status = HAL_I2C_Master_Transmit_IT(
                     hi2c,
                     BME68X_I2C_ADDR,           
                     buf,
                     len + 1,                   
                     0
                 );

    return (status == I2C_OK) ? 0 : -1;

}

void bme68x_delay_us(uint32_t period, void *intf_ptr)
{

    uint32_t ms = period / 1000;
    if (ms == 0) ms = 1;    
    HAL_Delay(ms);
}

struct bme68x_data bme68x_measure(struct bme68x_conf *conf,
                                   struct bme68x_dev *dev,
                                   struct bme68x_heatr_conf *heatr_conf)
{
    struct bme68x_data data = {0};
    uint8_t n_fields;

    bme68x_set_op_mode(BME68X_FORCED_MODE, dev);

    uint32_t meas_dur = bme68x_get_meas_dur(BME68X_FORCED_MODE, conf, dev)
                        + (heatr_conf->heatr_dur * 1000); 
                        
    dev->delay_us(meas_dur, dev->intf_ptr);

    int8_t rslt = bme68x_get_data(BME68X_FORCED_MODE, &data, &n_fields, dev);

    if (rslt == BME68X_OK && n_fields > 0)
    {
        data.pressure = data.pressure / 100.0f;  // Pa → hPa

        if (!(data.status & BME68X_HEAT_STAB_MSK))
            data.gas_resistance = 0;
    }

    return data;
}
