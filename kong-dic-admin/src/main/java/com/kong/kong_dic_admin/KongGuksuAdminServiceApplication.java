package com.kong.kong_dic_admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EntityScan(basePackages = {
		"com.kong.kong_dic.common.domain",
		"com.kong.kong_dic_admin.domain"
})
@EnableJpaRepositories(basePackages = {
		"com.kong.kong_dic.common.domain",
		"com.kong.kong_dic_admin.domain"
})
@SpringBootApplication
public class KongGuksuAdminServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(KongGuksuAdminServiceApplication.class, args);
	}

}
