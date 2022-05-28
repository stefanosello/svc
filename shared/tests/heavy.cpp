template <int i>
class A
{
    A<i - 1> x;
    A<i - 2> y;
};

template <>
class A<0>
{
    char a;
};

template <>
class A<1>
{
    char a;
};

int main()
{
    A<35> b;
    return 0;
}

//