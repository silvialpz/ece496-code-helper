#include <stdio.h>

int hello() {
    int a;
	int b = 1;
	int c = 2;

	printf("in function hello");
	b = b + c;
	
	if(a) {
		printf("yay!");
	}
}

int main(int argc, char** argv) {
    hello();
	
	printf("sup\n");

    return 0;
}