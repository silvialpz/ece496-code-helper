#include <stdio.h>

void hello() {
    int a = 1;
	int b = 1;
	int c = 2;

	printf("in function hello");
	b = b + c;
	
	if(a) {
		printf("yay!")
	}
}

int main(int argc, char** argv) {
    hello();

    return 0;
}