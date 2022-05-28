template < int i > class  A                           
{                                  
   A<i-1> x;                     
   A<i-2> y;
};

template <> class A<0>             
{ char a; };

template <> class A<1>             
{ char a; };

int main() {
  A<35>  b;
  return 0;
}

// template &lt;int i&gt; class A { A&lt;i-1&gt; x; A&lt;i-2&gt; y;};template &lt;&gt; class A&lt;0&gt; { char a; };template &lt;&gt; class A&lt;1&gt; { char a; };int main() {  A&lt;35&gt;  b;  return 0;}