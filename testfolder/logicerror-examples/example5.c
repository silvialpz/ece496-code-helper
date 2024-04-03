#include <stdio.h>

int main() {
    int num = 5;
    int *ptr = &num;
    
    // Logic Error: Trying to modify the value of a constant pointer
    *ptr = 10;
    
    printf("Modified value: %d\n", num);
    
    return 0;
}
